<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Patient;
use App\Models\Professional;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DemoScheduleSeeder extends Seeder
{
    private const DAYS_BACK = 14;

    private const DAYS_AHEAD = 21;

    private const BOOKING_RATIO = 0.4;

    /**
     * @var array{0: string, 1: string}
     */
    private const MORNING = ['09:00', '12:00'];

    /**
     * @var array{0: string, 1: string}
     */
    private const AFTERNOON = ['14:00', '17:00'];

    public function run(): void
    {
        if (AvailabilityWindow::query()->exists()) {
            $this->command?->warn('DemoScheduleSeeder: ya hay franjas cargadas, se omite.');

            return;
        }

        mt_srand(20261006);

        $this->ensureExtraPatients();

        $patients = Patient::query()->get();
        $professionals = Professional::query()->with('specialties')->get();

        foreach ($professionals as $index => $professional) {
            $this->seedProfessional($professional, $patients, $index);
        }
    }

    private function ensureExtraPatients(): void
    {
        $missing = 8 - Patient::query()->whereNull('user_id')->count();

        if ($missing > 0) {
            Patient::factory()->withoutUser()->count($missing)->create();
        }
    }

    /**
     * @param  Collection<int, Patient>  $patients
     */
    private function seedProfessional(Professional $professional, Collection $patients, int $index): void
    {
        $duration = (int) $professional->slot_duration_minutes;
        $specialtyIds = $professional->specialties->pluck('id')->all();
        $today = now()->startOfDay();

        for ($offset = -self::DAYS_BACK; $offset <= self::DAYS_AHEAD; $offset++) {
            $day = $today->copy()->addDays($offset);

            if ($day->isWeekend()) {
                continue;
            }

            foreach ($this->rangesFor($day, $index) as [$from, $to]) {
                $window = AvailabilityWindow::query()->create([
                    'professional_id' => $professional->id,
                    'starts_at' => $day->copy()->setTimeFromTimeString($from),
                    'ends_at' => $day->copy()->setTimeFromTimeString($to),
                ]);

                if ($specialtyIds === []) {
                    continue;
                }

                $this->bookWindow($professional, $window, $duration, $patients, $specialtyIds);
            }
        }
    }

    /**
     * Mañana fija; tarde en días alternados según el médico para que las agendas difieran.
     *
     * @return list<array{0: string, 1: string}>
     */
    private function rangesFor(Carbon $day, int $index): array
    {
        $ranges = [self::MORNING];

        if (($day->dayOfWeekIso + $index) % 2 === 0) {
            $ranges[] = self::AFTERNOON;
        }

        return $ranges;
    }

    /**
     * @param  Collection<int, Patient>  $patients
     * @param  list<int>  $specialtyIds
     */
    private function bookWindow(Professional $professional, AvailabilityWindow $window, int $duration, Collection $patients, array $specialtyIds): void
    {
        $cursor = $window->starts_at->copy();

        while ($cursor->copy()->addMinutes($duration)->lte($window->ends_at)) {
            if (mt_rand() / mt_getrandmax() < self::BOOKING_RATIO) {
                $patient = $patients->random();

                Appointment::query()->create([
                    'professional_id' => $professional->id,
                    'patient_id' => $patient->id,
                    'specialty_id' => $specialtyIds[array_rand($specialtyIds)],
                    'starts_at' => $cursor->copy(),
                    'ends_at' => $cursor->copy()->addMinutes($duration),
                ]);

                $professional->patients()->syncWithoutDetaching([$patient->id]);
            }

            $cursor->addMinutes($duration);
        }
    }
}
