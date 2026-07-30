<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Collection;

class DoctorPatientService
{
    public function link(Doctor $doctor, Patient $patient): void
    {
        $doctor->patients()->syncWithoutDetaching([$patient->id]);
    }

    /**
     * @return Collection<int, Patient>
     */
    public function listForDoctor(Doctor $doctor, ?string $q = null): Collection
    {
        $term = trim((string) $q);

        return $doctor->patients()
            ->with('user')
            ->when($term !== '', function ($query) use ($term) {
                $query->where(function ($inner) use ($term) {
                    $inner->where('dni', 'like', "%{$term}%")
                        ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$term}%"));
                });
            })
            ->join('users', 'patients.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->select('patients.*')
            ->get();
    }

    /**
     * Candidates for manual linking (registered patients matching DNI/name).
     *
     * @return Collection<int, Patient>
     */
    public function searchCandidates(?string $q = null): Collection
    {
        $term = trim((string) $q);

        if (mb_strlen($term) < 2) {
            return new Collection;
        }

        return Patient::query()
            ->with('user')
            ->where(function ($query) use ($term) {
                $query->where('dni', 'like', "%{$term}%")
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$term}%"));
            })
            ->orderBy('id')
            ->limit(20)
            ->get();
    }
}
