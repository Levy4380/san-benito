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
        $specialtyIds = $this->specialtyIdsFromDoctorAttributes($doctor);
        unset($doctor['specialty_id'], $doctor['specialty_ids']);

        $doctorModel = Doctor::factory()->create(array_merge([
            'user_id' => $userModel->id,
        ], $doctor));
        $doctorModel->specialties()->sync($specialtyIds);
        $userModel->assignRole('doctor');

        return $doctorModel->load(['user', 'specialties']);
    }

    /**
     * @param  array<string, mixed>  $doctor
     * @return list<int>
     */
    private function specialtyIdsFromDoctorAttributes(array $doctor): array
    {
        if (array_key_exists('specialty_ids', $doctor)) {
            return array_values(array_map('intval', (array) $doctor['specialty_ids']));
        }

        if (array_key_exists('specialty_id', $doctor)) {
            return [(int) $doctor['specialty_id']];
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
