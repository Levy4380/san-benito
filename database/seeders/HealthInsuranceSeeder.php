<?php

namespace Database\Seeders;

use App\Models\HealthInsurance;
use Illuminate\Database\Seeder;

class HealthInsuranceSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['OSDE', 'Swiss Medical'] as $name) {
            HealthInsurance::query()->firstOrCreate(['name' => $name]);
        }
    }
}
