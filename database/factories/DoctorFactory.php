<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'specialty_id' => Specialty::factory(),
            'license_number' => fake()->unique()->numerify('MN-######'),
            'slot_duration_minutes' => 20,
        ];
    }
}
