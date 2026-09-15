<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
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
            'doctor_id' => Doctor::factory(),
            'patient_id' => Patient::factory(),
            'specialty_id' => function (array $attributes): int {
                $doctor = Doctor::query()->find($attributes['doctor_id']);
                $specialtyId = $doctor?->specialties()->value('specialties.id');

                if ($specialtyId) {
                    return (int) $specialtyId;
                }

                $specialty = Specialty::query()->first() ?? Specialty::factory()->create();
                $doctor?->specialties()->syncWithoutDetaching([$specialty->id]);

                return $specialty->id;
            },
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(20),
        ];
    }
}
