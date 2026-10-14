<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\Professional;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class ProfessionalPatientService
{
    public function link(Professional $professional, Patient $patient): void
    {
        $professional->patients()->syncWithoutDetaching([$patient->id]);
    }

    public function findPatient(int $patientId): Patient
    {
        return Patient::query()->findOrFail($patientId);
    }

    public function profile(Patient $patient): Patient
    {
        return $patient->load(['user', 'healthInsurances']);
    }

    public function isLinked(Professional $professional, Patient $patient): bool
    {
        return $professional->patients()->where('patients.id', $patient->id)->exists();
    }

    /**
     * Vacío o "all" = Todas. Un id fuera del catálogo del professional no coincide con nadie.
     *
     * @param  SupportCollection<int, int>  $allowedIds
     * @return array{id: ?int, value: string}
     */
    public function parseOwnedFilter(mixed $input, SupportCollection $allowedIds): array
    {
        if (! is_string($input) || $input === '' || $input === 'all') {
            return ['id' => null, 'value' => 'all'];
        }

        $id = (int) $input;

        if (! $allowedIds->contains($id)) {
            return ['id' => 0, 'value' => $input];
        }

        return ['id' => $id, 'value' => $input];
    }

    /**
     * @return Collection<int, Patient>
     */
    public function patientsFor(Professional $professional, ?int $healthInsuranceId = null, ?int $specialtyId = null): Collection
    {
        $query = $professional->patients()->with(['user', 'healthInsurances'])->orderBy('patients.id');

        $this->constrainPatients($query->getQuery(), $professional, $healthInsuranceId, $specialtyId);

        return $query->get();
    }

    /**
     * @return Collection<int, Patient>
     */
    public function searchRegisteredPatients(string $term, Professional $professional, ?int $healthInsuranceId = null, ?int $specialtyId = null): Collection
    {
        $term = trim($term);

        if (mb_strlen($term) < 2) {
            return new Collection;
        }

        $query = Patient::query()
            ->with(['user', 'healthInsurances'])
            ->where(function ($patients) use ($term) {
                $patients->where('dni', 'like', '%'.$term.'%')
                    ->orWhere('name', 'like', '%'.$term.'%')
                    ->orWhere('email', 'like', '%'.$term.'%');
            })
            ->orderBy('id')
            ->limit(25);

        $this->constrainPatients($query, $professional, $healthInsuranceId, $specialtyId);

        return $query->get();
    }

    private function constrainPatients(mixed $query, Professional $professional, ?int $healthInsuranceId, ?int $specialtyId): void
    {
        if ($healthInsuranceId !== null) {
            $query->whereHas('healthInsurances', function ($insurances) use ($healthInsuranceId) {
                $insurances->whereKey($healthInsuranceId);
            });
        }

        if ($specialtyId !== null) {
            $query->whereHas('appointments', function ($appointments) use ($professional, $specialtyId) {
                $appointments->where('professional_id', $professional->id)->where('specialty_id', $specialtyId);
            });
        }
    }
}
