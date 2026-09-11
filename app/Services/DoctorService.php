<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DoctorService
{
    /**
     * @param  array{name: string, email: string, password: string, license_number: string, specialty_id: int, phone?: string|null, slot_duration_minutes?: int}  $data
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

            Doctor::query()->create([
                'user_id' => $user->id,
                'specialty_id' => $data['specialty_id'],
                'license_number' => $data['license_number'],
                'slot_duration_minutes' => $data['slot_duration_minutes'] ?? 20,
            ]);

            $user->assignRole('doctor');

            return $user;
        });
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
