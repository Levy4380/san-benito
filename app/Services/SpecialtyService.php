<?php

namespace App\Services;

use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SpecialtyService
{
    /**
     * @return Collection<int, Specialty>
     */
    public function list(): Collection
    {
        return Specialty::query()
            ->withCount('professionals')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return array{specialty: array{id: int, name: string}, professionals: list<array{id: int, name: string, assigned: bool}>}
     */
    public function editForm(Specialty $specialty): array
    {
        $assigned = $specialty->professionals()->pluck('professionals.id')->all();
        $assignedSet = array_flip($assigned);

        $professionals = Professional::query()
            ->with('user')
            ->join('users', 'users.id', '=', 'professionals.user_id')
            ->orderBy('users.name')
            ->select('professionals.*')
            ->get()
            ->map(fn (Professional $professional): array => [
                'id' => $professional->id,
                'name' => $professional->user->name,
                'assigned' => isset($assignedSet[$professional->id]),
            ])
            ->all();

        return [
            'specialty' => [
                'id' => $specialty->id,
                'name' => $specialty->name,
            ],
            'professionals' => $professionals,
        ];
    }

    /**
     * @param  array{name: string}  $data
     */
    public function create(array $data): Specialty
    {
        return Specialty::query()->create([
            'name' => $data['name'],
        ]);
    }

    /**
     * @param  array{name: string, professional_ids?: list<int>}  $data
     */
    public function update(Specialty $specialty, array $data): Specialty
    {
        return DB::transaction(function () use ($specialty, $data) {
            $specialty->update([
                'name' => $data['name'],
            ]);

            if (array_key_exists('professional_ids', $data)) {
                $specialty->professionals()->sync($data['professional_ids']);
            }

            return $specialty;
        });
    }

    public function delete(Specialty $specialty): void
    {
        if ($specialty->appointments()->exists()) {
            throw ValidationException::withMessages([
                'specialty' => 'No se puede eliminar la especialidad porque hay turnos asociados.',
            ]);
        }

        $specialty->delete();
    }
}
