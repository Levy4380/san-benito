<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BookingWizardService
{
    public function __construct(
        private readonly ProfessionalSearchService $search,
        private readonly AvailabilityService $availability,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(?string $coverage, ?int $specialtyId, ?int $professionalId, ?string $date, Patient $patient): array
    {
        $patient->loadMissing('healthInsurances');
        $insuranceId = $patient->healthInsurances->first()?->id;
        $effective = $this->effectiveCoverage($coverage, $insuranceId);

        $specialties = $effective === null
            ? collect()
            : $this->specialtiesFor($effective, $insuranceId);

        $professionals = collect();
        $nearestProfessionalId = null;

        if ($effective !== null && $specialtyId && $professionalId === null) {
            $found = $this->search->search($specialtyId, null, true);

            if ($effective === 'health_insurance' && $insuranceId !== null) {
                $found = $this->onlyProfessionalsWithInsurance($found, $insuranceId);
            }

            [$professionals, $nearestProfessionalId] = $this->professionalsWithAvailability($found);
        }

        $professional = null;
        $slots = collect();
        $daysWithSlots = collect();

        if ($effective !== null && $professionalId) {
            $professional = Professional::query()->with(['user', 'specialties'])->find($professionalId);

            if (
                $professional
                && $effective === 'health_insurance'
                && $insuranceId !== null
                && ! $professional->healthInsurances()->whereKey($insuranceId)->exists()
            ) {
                $professional = null;
            }

            if ($professional) {
                $daysWithSlots = $this->availability->upcomingDaysWithSlots($professional, 12);
                if ($date) {
                    $start = Carbon::parse($date)->startOfDay();
                    $end = Carbon::parse($date)->endOfDay();
                    $slots = $this->availability->nextOfferableSlotPerDay($professional, $start, $end);
                } else {
                    $slots = $this->availability->nextOfferableSlotPerDay(
                        $professional,
                        now(),
                        now()->addDays(60)->endOfDay(),
                    )->take(12)->values();
                }
            }
        }

        return [
            'specialties' => $specialties,
            'professionals' => $professionals,
            'nearest_professional_id' => $nearestProfessionalId,
            'professional' => $professional,
            'slots' => $slots,
            'daysWithSlots' => $daysWithSlots,
            'has_health_insurance' => $insuranceId !== null,
            'filters' => [
                'coverage' => $effective,
                'specialty_id' => $effective ? $specialtyId : null,
                'professional_id' => $professional?->id,
                'date' => $professional ? $date : null,
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
                ->whereHas('professionals', function ($professionals) use ($insuranceId): void {
                    $professionals->whereHas('healthInsurances', function ($insurances) use ($insuranceId): void {
                        $insurances->whereKey($insuranceId);
                    });
                })
                ->orderBy('name')
                ->get();
        }

        return $this->search->specialties(onlyWithProfessionals: true);
    }

    /**
     * @param  Collection<int, Professional>  $professionals
     * @return Collection<int, Professional>
     */
    private function onlyProfessionalsWithInsurance(Collection $professionals, int $insuranceId): Collection
    {
        if ($professionals->isEmpty()) {
            return $professionals;
        }

        $allowed = Professional::query()
            ->whereKey($professionals->modelKeys())
            ->whereHas('healthInsurances', function ($insurances) use ($insuranceId): void {
                $insurances->whereKey($insuranceId);
            })
            ->pluck('id');

        return $professionals->whereIn('id', $allowed->all())->values();
    }

    /**
     * Professionals with at least one free calculated slot (60-day horizon), nearest first.
     *
     * @param  Collection<int, Professional>  $professionals
     * @return array{0: Collection<int, Professional>, 1: ?int}
     */
    private function professionalsWithAvailability(Collection $professionals): array
    {
        $nearestId = null;
        $nearestAt = null;
        $withSlots = collect();

        foreach ($professionals as $professional) {
            $startsAt = $this->availability->nextAvailableStartsAt($professional);

            if ($startsAt === null) {
                continue;
            }

            $withSlots->push($professional);

            if ($nearestAt === null || $startsAt < $nearestAt) {
                $nearestAt = $startsAt;
                $nearestId = $professional->id;
            }
        }

        if ($nearestId !== null) {
            $withSlots = $withSlots
                ->sortBy(fn (Professional $professional): int => $professional->id === $nearestId ? 0 : 1)
                ->values();
        }

        return [$withSlots, $nearestId];
    }
}
