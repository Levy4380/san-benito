<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
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
    public function pageData(?string $coverage, ?int $specialtyId, ?int $doctorId, ?string $date, Patient $patient): array
    {
        $patient->loadMissing('healthInsurances');
        $insuranceId = $patient->healthInsurances->first()?->id;
        $effective = $this->effectiveCoverage($coverage, $insuranceId);

        $specialties = $effective === null
            ? collect()
            : $this->specialtiesFor($effective, $insuranceId);

        $doctors = collect();
        $nearestDoctorId = null;

        if ($effective !== null && $specialtyId && $doctorId === null) {
            $found = $this->search->search($specialtyId, null, true);

            if ($effective === 'health_insurance' && $insuranceId !== null) {
                $found = $this->onlyDoctorsWithInsurance($found, $insuranceId);
            }

            [$doctors, $nearestDoctorId] = $this->doctorsWithAvailability($found);
        }

        $doctor = null;
        $slots = collect();
        $daysWithSlots = collect();

        if ($effective !== null && $doctorId) {
            $doctor = Doctor::query()->with(['user', 'specialties'])->find($doctorId);

            if (
                $doctor
                && $effective === 'health_insurance'
                && $insuranceId !== null
                && ! $doctor->healthInsurances()->whereKey($insuranceId)->exists()
            ) {
                $doctor = null;
            }

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
            'has_health_insurance' => $insuranceId !== null,
            'filters' => [
                'coverage' => $effective,
                'specialty_id' => $effective ? $specialtyId : null,
                'doctor_id' => $doctor?->id,
                'date' => $doctor ? $date : null,
            ],
        ];
    }

    private function effectiveCoverage(?string $coverage, ?int $insuranceId): ?string
    {
        if ($coverage === 'particular') {
            return 'particular';
        }

        if ($coverage === 'health_insurance' && $insuranceId !== null) {
            return 'health_insurance';
        }

        return null;
    }

    /**
     * @return Collection<int, Specialty>
     */
    private function specialtiesFor(string $coverage, ?int $insuranceId): Collection
    {
        if ($coverage === 'health_insurance' && $insuranceId !== null) {
            return Specialty::query()
                ->whereHas('doctors', function ($doctors) use ($insuranceId): void {
                    $doctors->whereHas('healthInsurances', function ($insurances) use ($insuranceId): void {
                        $insurances->whereKey($insuranceId);
                    });
                })
                ->orderBy('name')
                ->get();
        }

        return $this->search->specialties(onlyWithDoctors: true);
    }

    /**
     * @param  Collection<int, Doctor>  $doctors
     * @return Collection<int, Doctor>
     */
    private function onlyDoctorsWithInsurance(Collection $doctors, int $insuranceId): Collection
    {
        if ($doctors->isEmpty()) {
            return $doctors;
        }

        $allowed = Doctor::query()
            ->whereKey($doctors->modelKeys())
            ->whereHas('healthInsurances', function ($insurances) use ($insuranceId): void {
                $insurances->whereKey($insuranceId);
            })
            ->pluck('id');

        return $doctors->whereIn('id', $allowed->all())->values();
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
