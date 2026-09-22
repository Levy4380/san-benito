<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DoctorService
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

            $doctor = Doctor::query()->create([
                'user_id' => $user->id,
                'license_number' => $data['license_number'],
                'slot_duration_minutes' => $data['slot_duration_minutes'] ?? 20,
            ]);

            $doctor->specialties()->sync($data['specialty_ids']);
            $doctor->healthInsurances()->sync($data['health_insurance_ids'] ?? []);

            $user->assignRole('doctor');

            return $user;
        });
    }

    /**
     * @param  list<int>  $specialtyIds
     */
    public function syncSpecialties(Doctor $doctor, array $specialtyIds): Doctor
    {
        $doctor->specialties()->sync($specialtyIds);

        return $doctor->refresh()->load(['user', 'specialties']);
    }

    /**
     * @param  list<int>  $healthInsuranceIds
     */
    public function syncHealthInsurances(Doctor $doctor, array $healthInsuranceIds): Doctor
    {
        $doctor->healthInsurances()->sync($healthInsuranceIds);

        return $doctor->refresh()->load(['user', 'specialties', 'healthInsurances']);
    }

    public function forUser(User $user): Doctor
    {
        $doctor = $user->doctor;

        if ($doctor === null) {
            abort(403);
        }

        return $doctor;
    }

    public function updateSlotDuration(Doctor $doctor, int $minutes): Doctor
    {
        $doctor->update([
            'slot_duration_minutes' => $minutes,
        ]);

        return $doctor->refresh();
    }
}
