<?php

namespace Database\Factories;

use App\Enums\SurgeryStatus;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Surgery;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Surgery>
 */
class SurgeryFactory extends Factory
{
    protected $model = Surgery::class;

    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'professional_id' => Professional::factory(),
            'health_insurance_id' => HealthInsurance::factory(),
            'requested_by_user_id' => User::factory(),
            'status' => SurgeryStatus::Pending,
            'note' => 'Nota de la cirugía.',
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    public function particular(): static
    {
        return $this->state(fn (): array => [
            'health_insurance_id' => null,
            'status' => SurgeryStatus::ToSchedule,
        ]);
    }

    public function requested(): static
    {
        return $this->state(fn (): array => [
            'status' => SurgeryStatus::Requested,
        ]);
    }

    public function toSchedule(): static
    {
        return $this->state(fn (): array => [
            'status' => SurgeryStatus::ToSchedule,
        ]);
    }

    public function scheduled(?Carbon $start = null): static
    {
        return $this->state(function () use ($start): array {
            $startsAt = $start ?? now()->addDay()->setTime(9, 0);

            return [
                'status' => SurgeryStatus::Scheduled,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addHour(),
            ];
        });
    }
}
