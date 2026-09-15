<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminUserService
{
    /**
     * @param  array{name: string, email: string, password: string, role: string, phone?: string|null}  $data
     */
    public function create(array $data): User
    {
        $role = $data['role'];

        if (! in_array($role, ['admin', 'super_admin'], true)) {
            throw ValidationException::withMessages([
                'role' => 'El rol no es válido.',
            ]);
        }

        return DB::transaction(function () use ($data, $role) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            $user->assignRole($role);

            return $user;
        });
    }

    /**
     * @return Collection<int, User>
     */
    public function listStaff(?string $name = null, ?string $email = null)
    {
        $query = User::query()
            ->role(['admin', 'super_admin'])
            ->with('roles')
            ->orderBy('id');

        $name = trim((string) $name);

        if ($name !== '') {
            $query->where('name', 'like', '%'.$name.'%');
        }

        $email = trim((string) $email);

        if ($email !== '') {
            $query->where('email', 'like', '%'.$email.'%');
        }

        return $query->get();
    }
}
