<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $juan = User::query()->create([
            'name' => 'Juan Paciente',
            'email' => 'juan@sanbenito.test',
            'password' => $password,
        ]);
        Patient::query()->create([
            'user_id' => $juan->id,
            'dni' => '30111222',
            'birth_date' => '1990-03-12',
            'health_insurance' => 'OSDE',
        ]);
        $juan->assignRole('patient');

        $laura = User::query()->create([
            'name' => 'Laura Paciente',
            'email' => 'laura@sanbenito.test',
            'password' => $password,
        ]);
        Patient::query()->create([
            'user_id' => $laura->id,
            'dni' => '32333444',
            'birth_date' => '1988-07-21',
            'health_insurance' => 'Swiss Medical',
        ]);
        $laura->assignRole('patient');

        $clinica = Specialty::query()->where('name', 'Clínica Médica')->firstOrFail();
        $pediatria = Specialty::query()->where('name', 'Pediatría')->firstOrFail();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();

        $this->createDoctor('Ana Pérez', 'ana.perez@sanbenito.test', $password, [$clinica->id, $cardio->id], 'MN-10001');
        $this->createDoctor('Luis Gómez', 'luis.gomez@sanbenito.test', $password, [$pediatria->id], 'MN-10002');
        $this->createDoctor('María López', 'maria.lopez@sanbenito.test', $password, [$cardio->id], 'MN-10003');

        $admin = User::query()->create([
            'name' => 'Admin San Benito',
            'email' => 'admin@sanbenito.test',
            'password' => $password,
        ]);
        $admin->assignRole('admin');

        $super = User::query()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@sanbenito.test',
            'password' => $password,
        ]);
        $super->assignRole('super_admin');
    }

    /**
     * @param  list<int>  $specialtyIds
     */
    private function createDoctor(string $name, string $email, string $password, array $specialtyIds, string $license): void
    {
        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        $doctor = Doctor::query()->create([
            'user_id' => $user->id,
            'license_number' => $license,
            'slot_duration_minutes' => 20,
        ]);

        $doctor->specialties()->attach($specialtyIds);

        $user->assignRole('doctor');
    }
}
