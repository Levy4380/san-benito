<?php

namespace Database\Factories;

use App\Models\HealthInsurance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HealthInsurance>
 */
class HealthInsuranceFactory extends Factory
{
    protected $model = HealthInsurance::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
        ];
    }
}
