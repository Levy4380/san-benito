<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $start = Carbon::now()->addDay()->startOfHour();

        return [
            'professional_id' => Professional::factory(),
            'patient_id' => Patient::factory(),
            'specialty_id' => function (array $attributes): int {
                $professional = Professional::query()->find($attributes['professional_id']);
                $specialtyId = $professional?->specialties()->value('specialties.id');

                if ($specialtyId) {
                    return (int) $specialtyId;
                }

                $specialty = Specialty::query()->first() ?? Specialty::factory()->create();
                $professional?->specialties()->syncWithoutDetaching([$specialty->id]);

                return $specialty->id;
            },
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(20),
        ];
    }
}
