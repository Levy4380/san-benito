<?php

namespace Database\Factories;

use App\Models\AvailabilityWindow;
use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<AvailabilityWindow>
 */
class AvailabilityWindowFactory extends Factory
{
    protected $model = AvailabilityWindow::class;

    public function definition(): array
    {
        $start = Carbon::now()->addDay()->startOfHour();

        return [
            'doctor_id' => Doctor::factory(),
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHours(3),
        ];
    }
}
