<?php

namespace Tests\Concerns;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SpecialtySeeder;

trait CreatesDomainUsers
{
    protected function seedRoles(): void
    {
        $this->seed(RoleSeeder::class);
    }

    protected function seedSpecialties(): void
    {
        $this->seed(SpecialtySeeder::class);
    }

    protected function createPatient(array $userAttributes = [], array $patientAttributes = []): Patient
    {
        $this->seedRoles();

        $user = User::factory()->create($userAttributes);
        $user->assignRole('patient');

        return Patient::factory()->create([
            'user_id' => $user->id,
            ...$patientAttributes,
        ]);
    }

    protected function createDoctor(array $userAttributes = [], array $doctorAttributes = []): Doctor
    {
        $this->seedRoles();
        $this->seedSpecialties();

        $user = User::factory()->create($userAttributes);
        $user->assignRole('doctor');

        return Doctor::factory()->create([
            'user_id' => $user->id,
            'specialty_id' => $doctorAttributes['specialty_id'] ?? Specialty::query()->first()->id,
            ...$doctorAttributes,
        ]);
    }

    protected function createAdmin(string $role = 'admin', array $userAttributes = []): User
    {
        $this->seedRoles();

        $user = User::factory()->create($userAttributes);
        $user->assignRole($role);

        return $user;
    }
}
