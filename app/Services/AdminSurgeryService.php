<?php

namespace App\Services;

use App\Enums\SurgeryStatus;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use App\Models\Surgery;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class AdminSurgeryService
{
    /**
     * @param  array{q?: string, specialty_id?: int|null, professional_id?: int|null, health_insurance_id?: int|string|null, status?: string|null}  $filters
     */
    public function paginate(string $section, array $filters): LengthAwarePaginator
    {
        $section = $this->section($section);
        $paginator = $this->filtered($section, $filters)->paginate(25)->withQueryString();

        if ($section !== 'approved') {
            return $paginator;
        }

        $previousStatus = null;

        if ($paginator->currentPage() > 1) {
            $previous = $this->filtered($section, $filters)
                ->skip(($paginator->currentPage() - 1) * 25 - 1)
                ->first();
            $previousStatus = $previous?->status->value;
        }

        $paginator->getCollection()->transform(function (Surgery $surgery) use (&$previousStatus): Surgery {
            $current = $surgery->status->value;
            $surgery->setAttribute(
                'opens_scheduled_group',
                $current === SurgeryStatus::Scheduled->value && $previousStatus !== SurgeryStatus::Scheduled->value,
            );
            $previousStatus = $current;

            return $surgery;
        });

        return $paginator;
    }

    /**
     * @return array{pending: int, requested: int, approved: int, history: int}
     */
    public function counts(): array
    {
        return [
            'pending' => Surgery::query()->inSection('pending')->count(),
            'requested' => Surgery::query()->inSection('requested')->count(),
            'approved' => Surgery::query()->inSection('approved')->count(),
            'history' => Surgery::query()->inSection('history')->count(),
        ];
    }

    /**
     * @return array{professionals: Collection<int, Professional>, specialties: Collection<int, Specialty>, healthInsurances: Collection<int, HealthInsurance>}
     */
    public function filterOptions(): array
    {
        return [
            'professionals' => Professional::query()->with(['user', 'specialties'])->orderBy('id')->get(),
            'specialties' => Specialty::query()->orderBy('name')->get(),
            'healthInsurances' => HealthInsurance::query()->orderBy('name')->get(),
        ];
    }

    /**
     * @return Collection<int, Patient>
     */
    public function searchPatients(string $term): Collection
    {
        $term = trim($term);

        if (mb_strlen($term) < 2) {
            return new Collection;
        }

        $like = '%'.$term.'%';

        return Patient::query()
            ->with('healthInsurances')
            ->where(function (Builder $patients) use ($like): void {
                $patients->where('patients.name', 'like', $like)
                    ->orWhere('patients.dni', 'like', $like)
                    ->orWhere('patients.email', 'like', $like);
            })
            ->orderBy('id')
            ->limit(25)
            ->get()
            ->each(function (Patient $patient): void {
                $patient->setAttribute('health_insurance_id', $patient->healthInsurances->first()?->id);
            });
    }

    /**
     * @param  array{q?: string, specialty_id?: int|null, professional_id?: int|null, health_insurance_id?: int|string|null, status?: string|null}  $filters
     * @return Builder<Surgery>
     */
    private function filtered(string $section, array $filters): Builder
    {
        $query = Surgery::query()
            ->with(['patient', 'professional.user', 'professional.specialties', 'healthInsurance'])
            ->inSection($section);

        $term = trim((string) ($filters['q'] ?? ''));

        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->whereHas('patient', function (Builder $patient) use ($like): void {
                $patient->where('patients.name', 'like', $like)
                    ->orWhere('patients.dni', 'like', $like);
            });
        }

        if (! empty($filters['professional_id'])) {
            $query->where('professional_id', (int) $filters['professional_id']);
        }

        if (! empty($filters['specialty_id'])) {
            $specialtyId = (int) $filters['specialty_id'];
            $query->whereHas('professional', function (Builder $professional) use ($specialtyId): void {
                $professional->whereHas('specialties', function (Builder $specialties) use ($specialtyId): void {
                    $specialties->whereKey($specialtyId);
                });
            });
        }

        $insurance = $filters['health_insurance_id'] ?? null;

        if ($insurance === 'particular') {
            $query->whereNull('health_insurance_id');
        } elseif (! empty($insurance)) {
            $query->where('health_insurance_id', (int) $insurance);
        }

        if ($section === 'approved') {
            $status = $filters['status'] ?? null;

            if ($status === SurgeryStatus::ToSchedule->value || $status === SurgeryStatus::Scheduled->value) {
                $query->where('status', $status);
            }
        }

        return $query;
    }

    private function section(string $section): string
    {
        return in_array($section, ['pending', 'requested', 'approved', 'history'], true) ? $section : 'pending';
    }
}
