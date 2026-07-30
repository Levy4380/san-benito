<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+30 days');
        $endsAt = (clone $startsAt)->modify('+30 minutes');

        return [
            'doctor_id' => Doctor::factory(),
            'patient_id' => null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => Appointment::STATUS_AVAILABLE,
        ];
    }

    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'patient_id' => null,
            'status' => Appointment::STATUS_AVAILABLE,
        ]);
    }

    public function booked(?Patient $patient = null): static
    {
        return $this->state(fn (array $attributes) => [
            'patient_id' => $patient?->id ?? Patient::factory(),
            'status' => Appointment::STATUS_BOOKED,
        ]);
    }
}
