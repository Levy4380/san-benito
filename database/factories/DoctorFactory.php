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
    protected $model = Doctor::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'license_number' => fake()->unique()->numerify('MN-#####'),
            'slot_duration_minutes' => 20,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Doctor $doctor): void {
            if ($doctor->specialties()->exists()) {
                return;
            }

            $specialty = Specialty::query()->first() ?? Specialty::factory()->create();
            $doctor->specialties()->attach($specialty->id);
        });
    }
}
