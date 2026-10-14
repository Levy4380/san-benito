<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Doctor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AgendaService
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly DoctorPatientService $links,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(Doctor $doctor, ?string $date, mixed $panel = null): array
    {
        $selected = $date ? Carbon::parse($date) : now();
        $monthStart = $selected->copy()->startOfMonth()->startOfDay();
        $monthEnd = $selected->copy()->endOfMonth()->endOfDay();

        $windows = AvailabilityWindow::query()
            ->forDoctor($doctor)
            ->overlapping($monthStart, $monthEnd)
            ->orderBy('starts_at')
            ->get();

        $appointments = Appointment::query()
            ->forDoctor($doctor)
            ->with(['doctor.user', 'doctor.specialties', 'patient.user', 'specialty'])
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->orderBy('starts_at')
            ->get();

        $slots = $this->availability->calculateSlots(
            $doctor,
            $monthStart->lt(now()) ? now() : $monthStart->copy(),
            $monthEnd,
        );

        $dayKey = $selected->toDateString();
        $daySlots = $slots->filter(fn (array $slot) => str_starts_with($slot['starts_at'], $dayKey))->values();
        $dayAppointments = $appointments->filter(fn (Appointment $appointment) => $appointment->starts_at->toDateString() === $dayKey)->values();
        $dayStart = $selected->copy()->startOfDay();
        $dayEnd = $selected->copy()->endOfDay();
        $dayWindows = $windows->filter(fn (AvailabilityWindow $window) => $window->starts_at->lte($dayEnd) && $window->ends_at->gt($dayStart))->values();

        $tones = $this->calendarTones($doctor, $monthStart, $monthEnd, $slots, $appointments, $windows);

        $step = is_string($panel) && in_array($panel, ['day', 'load'], true)
            ? $panel
            : 'day';

        return [
            'doctor' => $doctor->load(['user', 'specialties']),
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
     * Data for the doctor's assign modal: linked patients, specialties, upcoming days with free slots and the free slots of one day.
     *
     * @return array<string, mixed>
     */
    public function assignOptions(Doctor $doctor, ?string $date): array
    {
        $days = $this->availability->upcomingDaysWithSlots($doctor, 10);
        $day = $date ? Carbon::parse($date) : Carbon::parse($days->first() ?? now());
        $dayStart = $day->copy()->startOfDay();
        $dayEnd = $day->copy()->endOfDay();

        $slots = $dayEnd->lt(now())
            ? collect()
            : $this->availability->calculateSlots($doctor, $dayStart->lt(now()) ? now() : $dayStart, $dayEnd)->values();

        return [
            'date' => $day->toDateString(),
            'today' => now()->toDateString(),
            'days' => $days,
            'slots' => $slots,
            'slotMinutes' => $doctor->slot_duration_minutes,
            'timeline' => $this->dayTimeline($doctor, $day),
            'patients' => $this->links->patientsFor($doctor)
                ->map(fn ($patient) => ['id' => $patient->id, 'name' => $patient->name, 'dni' => $patient->dni])
                ->values(),
            'specialties' => $doctor->specialties()->orderBy('name')->get(['specialties.id', 'specialties.name'])
                ->map(fn ($specialty) => ['id' => $specialty->id, 'name' => $specialty->name])
                ->values(),
        ];
    }

    /**
     * Staff view of one doctor day: windows as bands, bookings as blocks, month tones by booking.
     *
     * @return array{timeline: array<string, mixed>, bookingTones: array<string, string>}
     */
    public function staffDayTimeline(Doctor $doctor, string $date): array
    {
        $day = Carbon::parse($date);
        $monthStart = $day->copy()->startOfMonth()->startOfDay();
        $monthEnd = $day->copy()->endOfMonth()->endOfDay();

        $bookedDays = Appointment::query()
            ->forDoctor($doctor)
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
            'timeline' => $this->dayTimeline($doctor, $day),
            'bookingTones' => $bookingTones,
        ];
    }

    /**
     * Windows overlapping the day, bookings of the day (patient + specialty) and the server wall clock.
     *
     * @return array{windows: Collection<int, AvailabilityWindow>, appointments: Collection<int, Appointment>, now: string}
     */
    private function dayTimeline(Doctor $doctor, Carbon $day): array
    {
        $dayStart = $day->copy()->startOfDay();
        $dayEnd = $day->copy()->endOfDay();

        return [
            'windows' => AvailabilityWindow::query()
                ->forDoctor($doctor)
                ->overlapping($dayStart, $dayEnd)
                ->orderBy('starts_at')
                ->get(),
            'appointments' => Appointment::query()
                ->forDoctor($doctor)
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
    public function tonesForNearbyMonths(Doctor $doctor): array
    {
        $monthStart = now()->copy()->startOfMonth()->subMonths(1)->startOfDay();
        $monthEnd = now()->copy()->addMonths(2)->endOfMonth()->endOfDay();
        $windows = AvailabilityWindow::query()
            ->forDoctor($doctor)
            ->overlapping($monthStart, $monthEnd)
            ->orderBy('starts_at')
            ->get();
        $appointments = Appointment::query()
            ->forDoctor($doctor)
            ->whereBetween('starts_at', [$monthStart, $monthEnd])
            ->get();
        $slots = $this->availability->calculateSlots(
            $doctor,
            $monthStart->lt(now()) ? now() : $monthStart->copy(),
            $monthEnd,
        );

        return $this->calendarTones($doctor, $monthStart, $monthEnd, $slots, $appointments, $windows);
    }

    /**
     * @param  Collection<int, array{starts_at: string, ends_at: string}>  $slots
     * @param  Collection<int, Appointment>  $appointments
     * @param  Collection<int, AvailabilityWindow>  $windows
     * @return array<string, string>
     */
    private function calendarTones(
        Doctor $doctor,
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
