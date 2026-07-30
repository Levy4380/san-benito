<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PatientService
{
    public function listWithUser()
    {
        return Patient::query()->with('user')->orderBy('id')->get();
    }

    /**
     * @param  array{name: string, email: string, password: string, phone?: string|null, dni: string, birth_date: string, health_insurance?: string|null}  $data
     */
    public function register(array $data): Patient
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            $user->assignRole('patient');

            return Patient::query()->create([
                'user_id' => $user->id,
                'dni' => $data['dni'],
                'birth_date' => $data['birth_date'],
                'health_insurance' => $data['health_insurance'] ?? null,
            ]);
        });
    }
}
