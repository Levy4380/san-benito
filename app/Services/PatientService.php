<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
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

    /**
     * @return Collection<int, Patient>
     */
    public function list(?string $name = null, ?string $email = null)
    {
        $query = Patient::query()
            ->with('user')
            ->orderBy('id');

        $name = trim((string) $name);

        if ($name !== '') {
            $query->whereHas('user', function ($users) use ($name) {
                $users->where('name', 'like', '%'.$name.'%');
            });
        }

        $email = trim((string) $email);

        if ($email !== '') {
            $query->whereHas('user', function ($users) use ($email) {
                $users->where('email', 'like', '%'.$email.'%');
            });
        }

        return $query->get();
    }
}
