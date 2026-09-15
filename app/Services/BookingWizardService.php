<?php

namespace App\Services;

use App\Models\Doctor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

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
        $specialties = $this->search->specialties(onlyWithDoctors: true);
        $doctors = collect();
        $nearestDoctorId = null;

        if ($specialtyId && $doctorId === null) {
            [$doctors, $nearestDoctorId] = $this->doctorsWithAvailability(
                $this->search->search($specialtyId, null, true),
            );
        }

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
                    $slots = $this->availability->nextOfferableSlotPerDay($doctor, $start, $end);
                } else {
                    $slots = $this->availability->nextOfferableSlotPerDay(
                        $doctor,
                        now(),
                        now()->addDays(60)->endOfDay(),
                    )->take(12)->values();
                }
            }
        }

        return [
            'specialties' => $specialties,
            'doctors' => $doctors,
            'nearest_doctor_id' => $nearestDoctorId,
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

    /**
     * Doctors with at least one free calculated slot (60-day horizon), nearest first.
     *
     * @param  Collection<int, Doctor>  $doctors
     * @return array{0: Collection<int, Doctor>, 1: ?int}
     */
    private function doctorsWithAvailability(Collection $doctors): array
    {
        $nearestId = null;
        $nearestAt = null;
        $withSlots = collect();

        foreach ($doctors as $doctor) {
            $startsAt = $this->availability->nextAvailableStartsAt($doctor);

            if ($startsAt === null) {
                continue;
            }

            $withSlots->push($doctor);

            if ($nearestAt === null || $startsAt < $nearestAt) {
                $nearestAt = $startsAt;
                $nearestId = $doctor->id;
            }
        }

        if ($nearestId !== null) {
            $withSlots = $withSlots
                ->sortBy(fn (Doctor $doctor): int => $doctor->id === $nearestId ? 0 : 1)
                ->values();
        }

        return [$withSlots, $nearestId];
    }
}
