<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\HealthInsurance;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class HealthInsuranceService
{
    /**
     * @return Collection<int, HealthInsurance>
     */
    public function list(): Collection
    {
        return HealthInsurance::query()
            ->withCount('doctors')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, HealthInsurance>
     */
    public function options(): Collection
    {
        return HealthInsurance::query()
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return array{healthInsurance: array{id: int, name: string}, doctors: list<array{id: int, name: string, assigned: bool}>}
     */
    public function editForm(HealthInsurance $healthInsurance): array
    {
        $assigned = $healthInsurance->doctors()->pluck('doctors.id')->all();
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
            'healthInsurance' => [
                'id' => $healthInsurance->id,
                'name' => $healthInsurance->name,
            ],
            'doctors' => $doctors,
        ];
    }

    /**
     * @param  array{name: string}  $data
     */
    public function create(array $data): HealthInsurance
    {
        return HealthInsurance::query()->create([
            'name' => $data['name'],
        ]);
    }

    /**
     * @param  array{name: string, doctor_ids?: list<int>}  $data
     */
    public function update(HealthInsurance $healthInsurance, array $data): HealthInsurance
    {
        return DB::transaction(function () use ($healthInsurance, $data) {
            $healthInsurance->update([
                'name' => $data['name'],
            ]);

            if (array_key_exists('doctor_ids', $data)) {
                $healthInsurance->doctors()->sync($data['doctor_ids']);
            }

            return $healthInsurance;
        });
    }

    public function delete(HealthInsurance $healthInsurance): void
    {
        $healthInsurance->delete();
    }
}
