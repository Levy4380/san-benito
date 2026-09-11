<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AdminUserService;
use Database\Seeders\RoleSeeder;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

class CreateSuperAdminCommand extends Command
{
    protected $signature = 'super-admin:create
        {--email=admin@sanbenito.test : Email del super admin}
        {--name=Super Admin : Nombre}
        {--password= : Contraseña (si se omite, se pide)}';

    protected $description = 'Crea el primer usuario super_admin';

    public function handle(AdminUserService $users, RoleSeeder $roles): int
    {
        $email = strtolower(trim((string) $this->option('email')));
        $name = trim((string) $this->option('name'));
        $password = $this->resolvePassword();

        if ($email === '' || $name === '') {
            $this->error('El nombre y el email son obligatorios.');

            return self::FAILURE;
        }

        if ($password === null) {
            $this->error('La contraseña es obligatoria (--password).');

            return self::FAILURE;
        }

        if (strlen($password) < 8) {
            $this->error('La contraseña debe tener al menos 8 caracteres.');

            return self::FAILURE;
        }

        if (User::query()->where('email', $email)->exists()) {
            $this->error("Ya existe un usuario con el email {$email}.");

            return self::FAILURE;
        }

        $roles->run();

        try {
            $user = $users->create([
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'role' => 'super_admin',
            ]);
        } catch (ValidationException $exception) {
            $this->error(collect($exception->errors())->flatten()->first() ?: 'No se pudo crear el super admin.');

            return self::FAILURE;
        }

        $this->info("Super admin creado: {$user->email}");

        return self::SUCCESS;
    }

    private function resolvePassword(): ?string
    {
        $password = $this->option('password');

        if (is_string($password) && $password !== '') {
            return $password;
        }

        if ($this->option('no-interaction')) {
            return null;
        }

        $typed = $this->secret('Contraseña');

        return is_string($typed) && $typed !== '' ? $typed : null;
    }
}
