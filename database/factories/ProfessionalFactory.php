<?php

namespace Database\Factories;

use App\Models\Professional;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Professional>
 */
class ProfessionalFactory extends Factory
{
    protected $model = Professional::class;

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
        return $this->afterCreating(function (Professional $professional): void {
            if ($professional->specialties()->exists()) {
                return;
            }

            $specialty = Specialty::query()->first() ?? Specialty::factory()->create();
            $professional->specialties()->attach($specialty->id);
        });
    }
}
