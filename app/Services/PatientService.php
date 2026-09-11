<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PatientService
{
    /**
     * @param  array{name: string, email: string, password: string, dni: string, birth_date: string, phone?: string|null, health_insurance?: string|null}  $data
     */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            Patient::query()->create([
                'user_id' => $user->id,
                'dni' => $data['dni'],
                'birth_date' => $data['birth_date'],
                'health_insurance' => $data['health_insurance'] ?? null,
            ]);

            $user->assignRole('patient');

            return $user;
        });
    }

    public function forUser(User $user): Patient
    {
        $patient = $user->patient;

        if ($patient === null) {
            abort(403);
        }

        return $patient;
    }
}
