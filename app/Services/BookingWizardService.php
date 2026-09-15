<?php

namespace App\Services;

use App\Models\Doctor;
use Illuminate\Support\Carbon;

class BookingWizardService
{
    public function __construct(
        private readonly DoctorSearchService $search,
        private readonly AvailabilityService $availability,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(?int $specialtyId, ?int $doctorId, ?string $date): array
    {
        $specialties = $this->search->specialties();
        $doctors = $specialtyId
            ? $this->search->search($specialtyId, null, true)
            : collect();

        $doctor = null;
        $slots = collect();
        $daysWithSlots = collect();

        if ($doctorId) {
            $doctor = Doctor::query()->with(['user', 'specialties'])->find($doctorId);
            if ($doctor) {
                $daysWithSlots = $this->availability->upcomingDaysWithSlots($doctor, 12);
                if ($date) {
                    $start = Carbon::parse($date)->startOfDay();
                    $end = Carbon::parse($date)->endOfDay();
                    $slots = $this->availability->calculateSlots($doctor, $start, $end);
                } else {
                    $rangeEnd = now()->addDays(20)->endOfDay();
                    $slots = $this->availability->calculateSlots($doctor, now(), $rangeEnd);
                }
            }
        }

        return [
            'specialties' => $specialties,
            'doctors' => $doctors,
            'doctor' => $doctor,
            'slots' => $slots,
            'daysWithSlots' => $daysWithSlots,
            'filters' => [
                'specialty_id' => $specialtyId,
                'doctor_id' => $doctorId,
                'date' => $date,
            ],
        ];
    }
}
