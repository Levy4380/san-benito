<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use App\Support\LocalDemoAccounts;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $clinica = Specialty::query()->where('name', 'Clínica Médica')->firstOrFail();
        $pediatria = Specialty::query()->where('name', 'Pediatría')->firstOrFail();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();

        foreach (LocalDemoAccounts::loginPicker() as $account) {
            match ($account['email']) {
                'superadmin@test.test' => $this->createStaff($account['name'], $account['email'], $password, 'super_admin'),
                'admin@test.test' => $this->createStaff($account['name'], $account['email'], $password, 'admin'),
                'doctor@test.test' => $this->createDoctor($account['name'], $account['email'], $password, [$clinica->id], 'MN-20001'),
                'paciente@test.test' => $this->createPatient($account['name'], $account['email'], $password, '40000001', '1992-05-18', 'OSDE'),
                default => throw new \UnhandledMatchError($account['email']),
            };
        }

        $this->createPatient('Juan Paciente', 'juan@sanbenito.test', $password, '30111222', '1990-03-12', 'OSDE');
        $this->createPatient('Laura Paciente', 'laura@sanbenito.test', $password, '32333444', '1988-07-21', 'Swiss Medical');

        $this->createDoctor('Ana Pérez', 'ana.perez@sanbenito.test', $password, [$clinica->id, $cardio->id], 'MN-10001');
        $this->createDoctor('Luis Gómez', 'luis.gomez@sanbenito.test', $password, [$pediatria->id], 'MN-10002');
        $this->createDoctor('María López', 'maria.lopez@sanbenito.test', $password, [$cardio->id], 'MN-10003');

        $this->createStaff('Admin San Benito', 'admin@sanbenito.test', $password, 'admin');
        $this->createStaff('Super Admin', 'superadmin@sanbenito.test', $password, 'super_admin');
    }

    private function createPatient(string $name, string $email, string $password, string $dni, string $birthDate, ?string $healthInsurance): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password],
        );

        $patient = Patient::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'dni' => $dni,
                'birth_date' => $birthDate,
            ],
        );

        if ($healthInsurance !== null) {
            $insurance = HealthInsurance::query()->where('name', $healthInsurance)->firstOrFail();
            $patient->healthInsurances()->sync([$insurance->id]);
        }

        $user->assignRole('patient');
    }

    /**
     * @param  list<int>  $specialtyIds
     */
    private function createDoctor(string $name, string $email, string $password, array $specialtyIds, string $license): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password],
        );

        $doctor = Doctor::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'license_number' => $license,
                'slot_duration_minutes' => 20,
            ],
        );

        $doctor->specialties()->syncWithoutDetaching($specialtyIds);

        $user->assignRole('doctor');
    }

    private function createStaff(string $name, string $email, string $password, string $role): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password],
        );

        $user->assignRole($role);
    }
}
