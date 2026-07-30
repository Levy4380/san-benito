<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Clínica Médica',
            'Pediatría',
            'Cardiología',
            'Dermatología',
            'Traumatología',
            'Ginecología',
        ];

        foreach ($names as $name) {
            Specialty::query()->firstOrCreate(['name' => $name]);
        }
    }
}
