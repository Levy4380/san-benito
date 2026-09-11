<?php

namespace Tests\Concerns;

use App\Models\Doctor;
use App\Models\Patient;
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

    protected function makeDoctor(array $user = [], array $doctor = []): Doctor
    {
        $userModel = User::factory()->create($user);
        $specialty = Specialty::query()->first() ?? Specialty::factory()->create(['name' => 'Clínica Médica']);
        $doctorModel = Doctor::factory()->create(array_merge([
            'user_id' => $userModel->id,
            'specialty_id' => $specialty->id,
        ], $doctor));
        $userModel->assignRole('doctor');

        return $doctorModel->load(['user', 'specialty']);
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
