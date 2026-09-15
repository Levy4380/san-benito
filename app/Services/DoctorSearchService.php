<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Collection;

class DoctorSearchService
{
    /**
     * Query string `specialty_id`: vacío o "all" = Todas (lista completa).
     *
     * @return array{id: ?int, value: string}
     */
    public function parseSpecialtyFilter(mixed $input): array
    {
        if (! is_string($input) || $input === '' || $input === 'all') {
            return ['id' => null, 'value' => 'all'];
        }

        return ['id' => (int) $input, 'value' => $input];
    }

    /**
     * @return Collection<int, Doctor>
     */
    public function search(?int $specialtyId, ?string $name, bool $filtered): Collection
    {
        if (! $filtered) {
            return new Collection;
        }

        $query = Doctor::query()->with(['user', 'specialties']);

        if ($specialtyId !== null) {
            $query->forSpecialty($specialtyId);
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
        return $doctor->load(['user', 'specialties']);
    }

    /**
     * @return Collection<int, Specialty>
     */
    public function specialties(): Collection
    {
        return Specialty::query()->orderBy('name')->get();
    }
}
