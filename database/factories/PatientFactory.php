<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'dni' => fake()->unique()->numerify('########'),
            'birth_date' => fake()->date('Y-m-d', '-18 years'),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Patient $patient): void {
            if ($patient->user_id === null) {
                return;
            }

            $user = User::query()->find($patient->user_id);

            if ($user === null) {
                return;
            }

            $patient->name = $user->name;
            $patient->email = $user->email;
            $patient->phone = $user->phone;
        });
    }

    public function withoutUser(): static
    {
        return $this->state(fn (): array => [
            'user_id' => null,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->optional()->numerify('11########'),
        ]);
    }
}
