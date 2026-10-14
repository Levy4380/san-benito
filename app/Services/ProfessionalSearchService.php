<?php

namespace App\Services;

use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Collection;

class ProfessionalSearchService
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
     * @return Collection<int, Professional>
     */
    public function search(?int $specialtyId, ?string $name, bool $filtered, bool $onlyWithSpecialties = false): Collection
    {
        if (! $filtered) {
            return new Collection;
        }

        $query = Professional::query()->with(['user', 'specialties']);

        if ($onlyWithSpecialties) {
            $query->withSpecialties();
        }

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

    public function profile(Professional $professional): Professional
    {
        return $professional->load(['user', 'specialties']);
    }

    /**
     * @return Collection<int, Specialty>
     */
    public function specialties(bool $onlyWithProfessionals = false): Collection
    {
        $query = Specialty::query()->orderBy('name');

        if ($onlyWithProfessionals) {
            $query->has('professionals');
        }

        return $query->get();
    }
}
