<?php

namespace App\Services;

use App\Models\Professional;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProfessionalService
{
    /**
     * @param  array{name: string, email: string, password: string, license_number: string, specialty_ids: list<int>, health_insurance_ids?: list<int>, phone?: string|null, slot_duration_minutes?: int}  $data
     */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            $professional = Professional::query()->create([
                'user_id' => $user->id,
                'license_number' => $data['license_number'],
                'slot_duration_minutes' => $data['slot_duration_minutes'] ?? 20,
            ]);

            $professional->specialties()->sync($data['specialty_ids']);
            $professional->healthInsurances()->sync($data['health_insurance_ids'] ?? []);

            $user->assignRole('professional');

            return $user;
        });
    }

    /**
     * @param  list<int>  $specialtyIds
     */
    public function syncSpecialties(Professional $professional, array $specialtyIds): Professional
    {
        $professional->specialties()->sync($specialtyIds);

        return $professional->refresh()->load(['user', 'specialties']);
    }

    /**
     * @param  list<int>  $healthInsuranceIds
     */
    public function syncHealthInsurances(Professional $professional, array $healthInsuranceIds): Professional
    {
        $professional->healthInsurances()->sync($healthInsuranceIds);

        return $professional->refresh()->load(['user', 'specialties', 'healthInsurances']);
    }

    public function forUser(User $user): Professional
    {
        $professional = $user->professional;

        if ($professional === null) {
            abort(403);
        }

        return $professional;
    }

    public function updateSlotDuration(Professional $professional, int $minutes): Professional
    {
        $professional->update([
            'slot_duration_minutes' => $minutes,
        ]);

        return $professional->refresh();
    }
}
