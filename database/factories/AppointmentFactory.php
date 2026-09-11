<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
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
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(20),
        ];
    }
}
