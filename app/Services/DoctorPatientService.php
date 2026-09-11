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

    public function findPatient(int $patientId): Patient
    {
        return Patient::query()->findOrFail($patientId);
    }

    public function profile(Patient $patient): Patient
    {
        return $patient->load('user');
    }

    public function isLinked(Doctor $doctor, Patient $patient): bool
    {
        return $doctor->patients()->where('patients.id', $patient->id)->exists();
    }

    /**
     * @return Collection<int, Patient>
     */
    public function patientsFor(Doctor $doctor): Collection
    {
        return $doctor->patients()->with('user')->orderBy('id')->get();
    }

    /**
     * @return Collection<int, Patient>
     */
    public function searchRegisteredPatients(string $term): Collection
    {
        $term = trim($term);

        if (mb_strlen($term) < 2) {
            return new Collection;
        }

        return Patient::query()
            ->with('user')
            ->where(function ($query) use ($term) {
                $query->where('dni', 'like', '%'.$term.'%')
                    ->orWhereHas('user', function ($users) use ($term) {
                        $users->where('name', 'like', '%'.$term.'%');
                    });
            })
            ->orderBy('id')
            ->limit(25)
            ->get();
    }
}
