<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Professional;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AgendaService
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly ProfessionalPatientService $links,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(Professional $professional, ?string $date, mixed $panel = null): array
    {
        $selected = $date ? Carbon::parse($date) : now();
        $monthStart = $selected->copy()->startOfMonth()->startOfDay();
        $monthEnd = $selected->copy()->endOfMonth()->endOfDay();

        $windows = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($monthStart, $monthEnd)
            ->orderBy('starts_at')
            ->get();

        $appointments = Appointment::query()
            ->forProfessional($professional)
            ->with(['professional.user', 'professional.specialties', 'patient.user', 'specialty'])
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->orderBy('starts_at')
            ->get();

        $slots = $this->availability->calculateSlots(
            $professional,
            $monthStart->lt(now()) ? now() : $monthStart->copy(),
            $monthEnd,
        );

        $dayKey = $selected->toDateString();
        $daySlots = $slots->filter(fn (array $slot) => str_starts_with($slot['starts_at'], $dayKey))->values();
        $dayAppointments = $appointments->filter(fn (Appointment $appointment) => $appointment->starts_at->toDateString() === $dayKey)->values();
        $dayStart = $selected->copy()->startOfDay();
        $dayEnd = $selected->copy()->endOfDay();
        $dayWindows = $windows->filter(fn (AvailabilityWindow $window) => $window->starts_at->lte($dayEnd) && $window->ends_at->gt($dayStart))->values();

        $tones = $this->calendarTones($professional, $monthStart, $monthEnd, $slots, $appointments, $windows);

        $step = is_string($panel) && in_array($panel, ['day', 'load'], true)
            ? $panel
            : 'day';

        return [
            'professional' => $professional->load(['user', 'specialties']),
            'selectedDate' => $dayKey,
            'panel' => $step,
            'windows' => $dayWindows,
            'slots' => $daySlots,
            'appointments' => $dayAppointments,
            'monthAppointments' => $appointments,
            'tones' => $tones,
            'now' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Data for the professional's assign modal: linked patients, specialties, upcoming days with free slots and the free slots of one day.
     *
     * @return array<string, mixed>
     */
    public function assignOptions(Professional $professional, ?string $date, ?string $month = null): array
    {
        $days = $this->availability->upcomingDaysWithSlots($professional, 10);
        $day = $date ? Carbon::parse($date) : Carbon::parse($days->first() ?? now());
        $dayStart = $day->copy()->startOfDay();
        $dayEnd = $day->copy()->endOfDay();

        $slots = $dayEnd->lt(now())
            ? collect()
            : $this->availability->calculateSlots($professional, $dayStart->lt(now()) ? now() : $dayStart, $dayEnd)->values();

        return [
            'date' => $day->toDateString(),
            'today' => now()->toDateString(),
            'days' => $days,
            'slots' => $slots,
            'slotMinutes' => $professional->slot_duration_minutes,
            'timeline' => $this->dayTimeline($professional, $day),
            'tones' => $this->tonesForMonth($professional, Carbon::parse($month ?? now()->toDateString())),
            'patients' => $this->links->patientsFor($professional)
                ->map(fn ($patient) => ['id' => $patient->id, 'name' => $patient->name, 'dni' => $patient->dni])
                ->values(),
            'specialties' => $professional->specialties()->orderBy('name')->get(['specialties.id', 'specialties.name'])
                ->map(fn ($specialty) => ['id' => $specialty->id, 'name' => $specialty->name])
                ->values(),
        ];
    }

    /**
     * Staff view of one professional day: windows as bands, bookings as blocks, month tones by booking.
     *
     * @return array{timeline: array<string, mixed>, bookingTones: array<string, string>}
     */
    public function staffDayTimeline(Professional $professional, string $date): array
    {
        $day = Carbon::parse($date);
        $monthStart = $day->copy()->startOfMonth()->startOfDay();
        $monthEnd = $day->copy()->endOfMonth()->endOfDay();

        $bookedDays = Appointment::query()
            ->forProfessional($professional)
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->pluck('starts_at')
            ->map(fn (Carbon $startsAt) => $startsAt->toDateString())
            ->unique()
            ->flip();

        $bookingTones = [];
        for ($cursor = $monthStart->copy(); $cursor->lte($monthEnd); $cursor->addDay()) {
            $key = $cursor->toDateString();
            $bookingTones[$key] = $bookedDays->has($key) ? 'has' : 'empty';
        }

        return [
            'timeline' => $this->dayTimeline($professional, $day),
            'bookingTones' => $bookingTones,
        ];
    }

    /**
     * Windows overlapping the day, bookings of the day (patient + specialty) and the server wall clock.
     *
     * @return array{windows: Collection<int, AvailabilityWindow>, appointments: Collection<int, Appointment>, now: string}
     */
    private function dayTimeline(Professional $professional, Carbon $day): array
    {
        $dayStart = $day->copy()->startOfDay();
        $dayEnd = $day->copy()->endOfDay();

        return [
            'windows' => AvailabilityWindow::query()
                ->forProfessional($professional)
                ->overlapping($dayStart, $dayEnd)
                ->orderBy('starts_at')
                ->get(),
            'appointments' => Appointment::query()
                ->forProfessional($professional)
                ->whereDate('starts_at', $dayStart->toDateString())
                ->with(['patient', 'specialty'])
                ->orderBy('starts_at')
                ->get(),
            'now' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function tonesForMonth(Professional $professional, Carbon $month): array
    {
        $monthStart = $month->copy()->startOfMonth()->startOfDay();
        $monthEnd = $month->copy()->endOfMonth()->endOfDay();
        $windows = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($monthStart, $monthEnd)
            ->orderBy('starts_at')
            ->get();
        $appointments = Appointment::query()
            ->forProfessional($professional)
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->get();
        $slots = $this->availability->calculateSlots(
            $professional,
            $monthStart->lt(now()) ? now() : $monthStart->copy(),
            $monthEnd,
        );

        return $this->calendarTones($professional, $monthStart, $monthEnd, $slots, $appointments, $windows);
    }

    /**
     * @return array<string, string>
     */
    public function tonesForNearbyMonths(Professional $professional): array
    {
        $monthStart = now()->copy()->startOfMonth()->subMonths(1)->startOfDay();
        $monthEnd = now()->copy()->addMonths(2)->endOfMonth()->endOfDay();
        $windows = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($monthStart, $monthEnd)
            ->orderBy('starts_at')
            ->get();
        $appointments = Appointment::query()
            ->forProfessional($professional)
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->get();
        $slots = $this->availability->calculateSlots(
            $professional,
            $monthStart->lt(now()) ? now() : $monthStart->copy(),
            $monthEnd,
        );

        return $this->calendarTones($professional, $monthStart, $monthEnd, $slots, $appointments, $windows);
    }

    /**
     * @param  Collection<int, array{starts_at: string, ends_at: string}>  $slots
     * @param  Collection<int, Appointment>  $appointments
     * @param  Collection<int, AvailabilityWindow>  $windows
     * @return array<string, string>
     */
    private function calendarTones(
        Professional $professional,
        Carbon $monthStart,
        Carbon $monthEnd,
        Collection $slots,
        Collection $appointments,
        Collection $windows,
    ): array {
        $tones = [];
        $cursor = $monthStart->copy();

        while ($cursor->lte($monthEnd)) {
            $key = $cursor->toDateString();
            $hasWindow = $windows->contains(fn (AvailabilityWindow $window) => $window->starts_at->toDateString() === $key);
            $free = $slots->contains(fn (array $slot) => str_starts_with($slot['starts_at'], $key));
            $booked = $appointments->contains(fn (Appointment $appointment) => $appointment->starts_at->toDateString() === $key);

            if (! $hasWindow) {
                $tones[$key] = 'empty';
            } elseif ($free) {
                $tones[$key] = 'has';
            } elseif ($booked) {
                $tones[$key] = 'full';
            } else {
                $tones[$key] = 'empty';
            }

            $cursor->addDay();
        }

        return $tones;
    }
}
