<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Collection;

class DoctorSearchService
{
    /**
     * @return Collection<int, Doctor>
     */
    public function search(?int $specialtyId, ?string $name, bool $filtered): Collection
    {
        if (! $filtered) {
            return new Collection;
        }

        $query = Doctor::query()->with(['user', 'specialty']);

        if ($specialtyId !== null) {
            $query->where('specialty_id', $specialtyId);
        }

        $name = trim((string) $name);

        if ($name !== '') {
            $query->whereHas('user', function ($users) use ($name) {
                $users->where('name', 'like', '%'.$name.'%');
            });
        }

        return $query->orderBy('id')->get();
    }

    public function profile(Doctor $doctor): Doctor
    {
        return $doctor->load(['user', 'specialty']);
    }

    /**
     * @return Collection<int, Specialty>
     */
    public function specialties(): Collection
    {
        return Specialty::query()->orderBy('name')->get();
    }
}
