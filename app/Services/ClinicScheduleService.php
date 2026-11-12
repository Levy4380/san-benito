<?php

namespace App\Services;

use App\Models\ClinicSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ClinicScheduleService
{
    /**
     * @var array<int, string>
     */
    private const DAY_NAMES = [
        1 => 'lunes',
        2 => 'martes',
        3 => 'miércoles',
        4 => 'jueves',
        5 => 'viernes',
        6 => 'sábado',
        7 => 'domingo',
    ];

    public function current(): ClinicSchedule
    {
        $schedule = ClinicSchedule::query()->first();

        if ($schedule instanceof ClinicSchedule) {
            return $schedule;
        }

        return ClinicSchedule::query()->create([
            'open_days' => [1, 2, 3, 4, 5, 6, 7],
            'opens_at' => '07:00:00',
            'closes_at' => '21:00:00',
        ]);
    }

    /**
     * @param  list<int>  $openDays  ISO-8601, 1 = lunes … 7 = domingo
     */
    public function update(array $openDays, string $opensAt, string $closesAt): ClinicSchedule
    {
        $days = collect($openDays)
            ->map(fn (int|string $day) => (int) $day)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $schedule = $this->current();
        $schedule->update([
            'open_days' => $days,
            'opens_at' => $opensAt.':00',
            'closes_at' => $closesAt.':00',
        ]);

        return $schedule->refresh();
    }

    /**
     * @return array{openDays: list<int>, opensAt: string, closesAt: string}
     */
    public function share(): array
    {
        $schedule = $this->current();

        return [
            'openDays' => $this->openDays($schedule),
            'opensAt' => $this->clock($schedule->opens_at),
            'closesAt' => $this->clock($schedule->closes_at),
        ];
    }

    public function assertWindow(Carbon $start, Carbon $end): void
    {
        $schedule = $this->current();
        $openDays = $this->openDays($schedule);

        if (! in_array($start->dayOfWeekIso, $openDays, true)) {
            $name = self::DAY_NAMES[$start->dayOfWeekIso] ?? 'ese día';

            throw ValidationException::withMessages([
                'dates' => 'El sanatorio no abre los '.$name.'. No se puede programar el '.$start->format('d/m/Y').'.',
            ]);
        }

        $opensAt = $this->clock($schedule->opens_at);
        $closesAt = $this->clock($schedule->closes_at);
        $open = $this->minutes($opensAt);
        $close = $this->minutes($closesAt);
        $startMinutes = ($start->hour * 60) + $start->minute;
        $endMinutes = ($end->hour * 60) + $end->minute;
        $outside = ! $start->isSameDay($end) || $startMinutes < $open || $endMinutes > $close;

        if ($outside) {
            throw ValidationException::withMessages([
                'ranges' => sprintf(
                    'El sanatorio atiende de %s a %s. La franja %s–%s del %s queda fuera de ese horario.',
                    $opensAt,
                    $closesAt,
                    $start->format('H:i'),
                    $end->format('H:i'),
                    $start->format('d/m/Y'),
                ),
            ]);
        }
    }

    /**
     * @return list<int>
     */
    private function openDays(ClinicSchedule $schedule): array
    {
        return collect($schedule->open_days)
            ->map(fn (mixed $day) => (int) $day)
            ->values()
            ->all();
    }

    private function clock(mixed $value): string
    {
        return substr((string) $value, 0, 5);
    }

    private function minutes(string $clock): int
    {
        [$hour, $minute] = array_map(intval(...), explode(':', $clock));

        return ($hour * 60) + $minute;
    }
}
