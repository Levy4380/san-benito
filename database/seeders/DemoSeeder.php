<?php

namespace Database\Seeders;

use App\Models\Appointment;
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
        $superAdmin = User::query()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@sanbenito.test',
            'password' => Hash::make('password'),
        ]);
        $superAdmin->assignRole('super_admin');

        $admin = User::query()->create([
            'name' => 'Administrador',
            'email' => 'admin@sanbenito.test',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('admin');

        $specialties = Specialty::query()->get();

        $doctorUsers = [
            ['name' => 'Dra. Ana Pérez', 'email' => 'ana.perez@sanbenito.test', 'license' => 'MN-100001'],
            ['name' => 'Dr. Luis Gómez', 'email' => 'luis.gomez@sanbenito.test', 'license' => 'MN-100002'],
            ['name' => 'Dra. María López', 'email' => 'maria.lopez@sanbenito.test', 'license' => 'MN-100003'],
        ];

        foreach ($doctorUsers as $index => $doctorData) {
            $user = User::query()->create([
                'name' => $doctorData['name'],
                'email' => $doctorData['email'],
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('doctor');

            $doctor = Doctor::query()->create([
                'user_id' => $user->id,
                'specialty_id' => $specialties[$index % $specialties->count()]->id,
                'license_number' => $doctorData['license'],
            ]);

            for ($i = 1; $i <= 5; $i++) {
                $startsAt = now()->addDays($i)->setTime(9 + $i, 0);
                Appointment::query()->create([
                    'doctor_id' => $doctor->id,
                    'patient_id' => null,
                    'starts_at' => $startsAt,
                    'ends_at' => $startsAt->copy()->addMinutes(30),
                    'status' => Appointment::STATUS_AVAILABLE,
                ]);
            }
        }

        foreach ([
            ['name' => 'Juan Paciente', 'email' => 'juan@sanbenito.test', 'dni' => '30111222'],
            ['name' => 'Laura Paciente', 'email' => 'laura@sanbenito.test', 'dni' => '30222333'],
        ] as $patientData) {
            $user = User::query()->create([
                'name' => $patientData['name'],
                'email' => $patientData['email'],
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('patient');

            Patient::query()->create([
                'user_id' => $user->id,
                'dni' => $patientData['dni'],
                'birth_date' => '1990-01-15',
                'health_insurance' => 'OSDE',
            ]);
        }

        $firstDoctor = Doctor::query()->orderBy('id')->first();
        $patients = Patient::query()->orderBy('id')->get();
        if ($firstDoctor && $patients->isNotEmpty()) {
            $firstDoctor->patients()->syncWithoutDetaching($patients->pluck('id')->all());
        }
    }
}
