<?php

namespace Tests\Concerns;

use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use App\Models\User;

trait CreatesDomainUsers
{
    protected function makePatient(array $user = [], array $patient = []): Patient
    {
        $userModel = User::factory()->create($user);
        $patientModel = Patient::factory()->create(array_merge([
            'user_id' => $userModel->id,
        ], $patient));
        $userModel->assignRole('patient');

        return $patientModel->load('user');
    }

    protected function makeProfessional(array $user = [], array $professional = []): Professional
    {
        $userModel = User::factory()->create($user);
        $specialtyIds = $this->specialtyIdsFromProfessionalAttributes($professional);
        unset($professional['specialty_id'], $professional['specialty_ids']);

        $professionalModel = Professional::factory()->create(array_merge([
            'user_id' => $userModel->id,
        ], $professional));
        $professionalModel->specialties()->sync($specialtyIds);
        $userModel->assignRole('professional');

        return $professionalModel->load(['user', 'specialties']);
    }

    /**
     * @param  array<string, mixed>  $professional
     * @return list<int>
     */
    private function specialtyIdsFromProfessionalAttributes(array $professional): array
    {
        if (array_key_exists('specialty_ids', $professional)) {
            return array_values(array_map('intval', (array) $professional['specialty_ids']));
        }

        if (array_key_exists('specialty_id', $professional)) {
            return [(int) $professional['specialty_id']];
        }

        $specialty = Specialty::query()->first() ?? Specialty::factory()->create(['name' => 'Clínica Médica']);

        return [$specialty->id];
    }

    protected function makeAdmin(array $user = []): User
    {
        $userModel = User::factory()->create($user);
        $userModel->assignRole('admin');

        return $userModel;
    }

    protected function makeSuperAdmin(array $user = []): User
    {
        $userModel = User::factory()->create($user);
        $userModel->assignRole('super_admin');

        return $userModel;
    }
}
