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
use Illuminate\Support\Carbon;

class AdminSurgeryService
{
    /**
     * @param  array{q?: string, specialty_id?: int|null, professional_id?: int|null, health_insurance_id?: int|string|null, status?: string|null}  $filters
     */
    public function paginate(string $section, array $filters, ?int $professionalId = null): LengthAwarePaginator
    {
        $section = $this->section($section);
        $paginator = $this->filtered($section, $filters, $professionalId)->paginate(25)->withQueryString();

        if ($section !== 'approved') {
            return $paginator;
        }

        $previousStatus = null;

        if ($paginator->currentPage() > 1) {
            $previous = $this->filtered($section, $filters, $professionalId)
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
    public function counts(?int $professionalId = null): array
    {
        return [
            'pending' => $this->sectionQuery('pending', $professionalId)->count(),
            'requested' => $this->sectionQuery('requested', $professionalId)->count(),
            'approved' => $this->sectionQuery('approved', $professionalId)->count(),
            'history' => $this->sectionQuery('history', $professionalId)->count(),
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
     * Portal create JSON: obras sociales only (no professionals list).
     *
     * @return array{healthInsurances: Collection<int, HealthInsurance>}
     */
    public function createOptionsForProfessional(): array
    {
        return [
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
     * Portal create search: only patients linked to the professional.
     *
     * @return Collection<int, Patient>
     */
    public function searchLinkedPatients(Professional $professional, string $term): Collection
    {
        $term = trim($term);

        if (mb_strlen($term) < 2) {
            return new Collection;
        }

        $like = '%'.$term.'%';

        return $professional->patients()
            ->with('healthInsurances')
            ->where(function (Builder $patients) use ($like): void {
                $patients->where('patients.name', 'like', $like)
                    ->orWhere('patients.dni', 'like', $like)
                    ->orWhere('patients.email', 'like', $like);
            })
            ->orderBy('patients.id')
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
    private function filtered(string $section, array $filters, ?int $professionalId = null): Builder
    {
        $query = $this->sectionQuery($section, $professionalId)
            ->with(['patient', 'professional.user', 'professional.specialties', 'healthInsurance']);

        $term = trim((string) ($filters['q'] ?? ''));

        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->whereHas('patient', function (Builder $patient) use ($like): void {
                $patient->where('patients.name', 'like', $like)
                    ->orWhere('patients.dni', 'like', $like);
            });
        }

        if ($professionalId === null && ! empty($filters['professional_id'])) {
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

    public function findInSection(string $section, int $id, ?int $professionalId = null): ?Surgery
    {
        if ($id < 1) {
            return null;
        }

        return $this->sectionQuery($this->section($section), $professionalId)
            ->with(['patient', 'professional.user', 'professional.specialties', 'healthInsurance'])
            ->whereKey($id)
            ->first();
    }

    /**
     * @return Collection<int, Surgery>
     */
    public function scheduledOnDate(string $date, ?int $professionalId = null): Collection
    {
        $query = Surgery::query()
            ->with(['patient', 'professional.user', 'professional.specialties', 'healthInsurance'])
            ->scheduledOnDate($date);

        $this->constrainProfessional($query, $professionalId);

        return $query->get();
    }

    /**
     * @return array<string, int>
     */
    public function monthScheduledCounts(Carbon|string $monthStart, Carbon|string $monthEnd, ?int $professionalId = null): array
    {
        $start = $monthStart instanceof Carbon ? $monthStart : Carbon::parse($monthStart);
        $end = $monthEnd instanceof Carbon ? $monthEnd : Carbon::parse($monthEnd);

        $query = Surgery::query()
            ->where('status', SurgeryStatus::Scheduled)
            ->whereDate('starts_at', '>=', $start->toDateString())
            ->whereDate('starts_at', '<=', $end->toDateString());

        $this->constrainProfessional($query, $professionalId);

        return $query
            ->selectRaw('DATE(starts_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(starts_at)')
            ->pluck('total', 'day')
            ->map(fn ($total): int => (int) $total)
            ->all();
    }

    /**
     * @return Builder<Surgery>
     */
    private function sectionQuery(string $section, ?int $professionalId = null): Builder
    {
        $query = Surgery::query()->inSection($section);
        $this->constrainProfessional($query, $professionalId);

        return $query;
    }

    /**
     * @param  Builder<Surgery>  $query
     */
    private function constrainProfessional(Builder $query, ?int $professionalId): void
    {
        if ($professionalId !== null) {
            $query->where('professional_id', $professionalId);
        }
    }

    private function section(string $section): string
    {
        return in_array($section, ['pending', 'requested', 'approved', 'history'], true) ? $section : 'pending';
    }
}
