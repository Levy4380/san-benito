<?php

namespace App\Services;

use App\Models\Doctor;
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
            ->withCount('doctors')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return array{specialty: array{id: int, name: string}, doctors: list<array{id: int, name: string, assigned: bool}>}
     */
    public function editForm(Specialty $specialty): array
    {
        $assigned = $specialty->doctors()->pluck('doctors.id')->all();
        $assignedSet = array_flip($assigned);

        $doctors = Doctor::query()
            ->with('user')
            ->join('users', 'users.id', '=', 'doctors.user_id')
            ->orderBy('users.name')
            ->select('doctors.*')
            ->get()
            ->map(fn (Doctor $doctor): array => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'assigned' => isset($assignedSet[$doctor->id]),
            ])
            ->all();

        return [
            'specialty' => [
                'id' => $specialty->id,
                'name' => $specialty->name,
            ],
            'doctors' => $doctors,
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
     * @param  array{name: string, doctor_ids?: list<int>}  $data
     */
    public function update(Specialty $specialty, array $data): Specialty
    {
        return DB::transaction(function () use ($specialty, $data) {
            $specialty->update([
                'name' => $data['name'],
            ]);

            if (array_key_exists('doctor_ids', $data)) {
                $specialty->doctors()->sync($data['doctor_ids']);
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
