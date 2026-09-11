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
    public function pageData(Doctor $doctor, ?string $date, ?int $preselectedPatientId): array
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
            ->with('patient.user')
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
        $dayWindows = $windows->filter(fn (AvailabilityWindow $window) => $window->starts_at->toDateString() === $dayKey)->values();

        $tones = $this->calendarTones($doctor, $monthStart, $monthEnd, $slots, $appointments, $windows);

        $patients = $this->links->patientsFor($doctor);
        $preselected = $preselectedPatientId
            ? $patients->firstWhere('id', $preselectedPatientId)
            : null;

        return [
            'doctor' => $doctor->load(['user', 'specialty']),
            'selectedDate' => $dayKey,
            'windows' => $dayWindows,
            'slots' => $daySlots,
            'appointments' => $dayAppointments,
            'monthAppointments' => $appointments,
            'tones' => $tones,
            'patients' => $patients,
            'preselectedPatient' => $preselected,
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
