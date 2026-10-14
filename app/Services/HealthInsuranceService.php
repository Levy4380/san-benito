<?php

namespace App\Services;

use App\Models\HealthInsurance;
use App\Models\Professional;
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
            ->withCount('professionals')
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
     * @return array{healthInsurance: array{id: int, name: string}, professionals: list<array{id: int, name: string, assigned: bool}>}
     */
    public function editForm(HealthInsurance $healthInsurance): array
    {
        $assigned = $healthInsurance->professionals()->pluck('professionals.id')->all();
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
            'healthInsurance' => [
                'id' => $healthInsurance->id,
                'name' => $healthInsurance->name,
            ],
            'professionals' => $professionals,
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
     * @param  array{name: string, professional_ids?: list<int>}  $data
     */
    public function update(HealthInsurance $healthInsurance, array $data): HealthInsurance
    {
        return DB::transaction(function () use ($healthInsurance, $data) {
            $healthInsurance->update([
                'name' => $data['name'],
            ]);

            if (array_key_exists('professional_ids', $data)) {
                $healthInsurance->professionals()->sync($data['professional_ids']);
            }

            return $healthInsurance;
        });
    }

    public function delete(HealthInsurance $healthInsurance): void
    {
        $healthInsurance->delete();
    }
}
