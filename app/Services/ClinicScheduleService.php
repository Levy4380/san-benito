<?php

namespace App\Services;

use App\Models\ClinicSchedule;
use App\Models\ClinicScheduleException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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

    /**
     * @var Collection<string, ClinicScheduleException>|null
     */
    private ?Collection $exceptionsByDate = null;

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

    public function storeException(string $date, bool $closed, ?string $opensAt, ?string $closesAt, ?string $label): ClinicScheduleException
    {
        $exception = ClinicScheduleException::query()->create([
            'date' => $date,
            'closed' => $closed,
            'opens_at' => $closed || $opensAt === null ? null : $opensAt.':00',
            'closes_at' => $closed || $closesAt === null ? null : $closesAt.':00',
            'label' => $this->label($label),
        ]);

        $this->exceptionsByDate = null;

        return $exception;
    }

    public function deleteException(ClinicScheduleException $exception): void
    {
        $exception->delete();
        $this->exceptionsByDate = null;
    }

    /**
     * Effective hours for a civil day. An exception replaces the weekly schedule.
     * Null means the sanatorium is closed that day.
     *
     * @return array{opensAt: string, closesAt: string}|null
     */
    public function hoursOn(Carbon|string $date): ?array
    {
        $key = $date instanceof Carbon ? $date->toDateString() : substr($date, 0, 10);
        $exception = $this->exceptionsByDate()->get($key);

        if ($exception instanceof ClinicScheduleException) {
            if ($exception->closed) {
                return null;
            }

            return [
                'opensAt' => $this->clock($exception->opens_at),
                'closesAt' => $this->clock($exception->closes_at),
            ];
        }

        $schedule = $this->current();

        if (! in_array(Carbon::parse($key)->dayOfWeekIso, $this->openDays($schedule), true)) {
            return null;
        }

        return [
            'opensAt' => $this->clock($schedule->opens_at),
            'closesAt' => $this->clock($schedule->closes_at),
        ];
    }

    public function contains(Carbon $start, Carbon $end): bool
    {
        $hours = $this->hoursOn($start);

        if ($hours === null || ! $start->isSameDay($end)) {
            return false;
        }

        $startMinutes = ($start->hour * 60) + $start->minute;
        $endMinutes = ($end->hour * 60) + $end->minute;

        return $startMinutes >= $this->minutes($hours['opensAt']) && $endMinutes <= $this->minutes($hours['closesAt']);
    }

    /**
     * @return array{openDays: list<int>, opensAt: string, closesAt: string, exceptions: list<array{id: int, date: string, closed: bool, opensAt: string|null, closesAt: string|null, label: string|null}>}
     */
    public function share(): array
    {
        $schedule = $this->current();

        return [
            'openDays' => $this->openDays($schedule),
            'opensAt' => $this->clock($schedule->opens_at),
            'closesAt' => $this->clock($schedule->closes_at),
            'exceptions' => $this->exceptionsByDate()
                ->sortBy(fn (ClinicScheduleException $exception): string => $this->dateKey($exception))
                ->values()
                ->map(fn (ClinicScheduleException $exception): array => [
                    'id' => $exception->id,
                    'date' => $this->dateKey($exception),
                    'closed' => $exception->closed,
                    'opensAt' => $exception->closed ? null : $this->clock($exception->opens_at),
                    'closesAt' => $exception->closed ? null : $this->clock($exception->closes_at),
                    'label' => $exception->label,
                ])
                ->all(),
        ];
    }

    public function assertWindow(Carbon $start, Carbon $end): void
    {
        $hours = $this->hoursOn($start);

        if ($hours === null) {
            $exception = $this->exceptionsByDate()->get($start->toDateString());

            if ($exception instanceof ClinicScheduleException && $exception->closed) {
                throw ValidationException::withMessages([
                    'dates' => 'El sanatorio está cerrado el '.$start->format('d/m/Y').'.',
                ]);
            }

            $name = self::DAY_NAMES[$start->dayOfWeekIso] ?? 'ese día';

            throw ValidationException::withMessages([
                'dates' => 'El sanatorio no abre los '.$name.'. No se puede programar el '.$start->format('d/m/Y').'.',
            ]);
        }

        if ($this->contains($start, $end)) {
            return;
        }

        throw ValidationException::withMessages([
            'ranges' => sprintf(
                'El sanatorio atiende de %s a %s. La franja %s–%s del %s queda fuera de ese horario.',
                $hours['opensAt'],
                $hours['closesAt'],
                $start->format('H:i'),
                $end->format('H:i'),
                $start->format('d/m/Y'),
            ),
        ]);
    }

    /**
     * @return Collection<string, ClinicScheduleException>
     */
    private function exceptionsByDate(): Collection
    {
        if ($this->exceptionsByDate instanceof Collection) {
            return $this->exceptionsByDate;
        }

        $this->exceptionsByDate = ClinicScheduleException::query()
            ->orderBy('date')
            ->get()
            ->keyBy(fn (ClinicScheduleException $exception): string => $this->dateKey($exception));

        return $this->exceptionsByDate;
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

    private function dateKey(ClinicScheduleException $exception): string
    {
        $date = $exception->date;

        return $date instanceof Carbon ? $date->toDateString() : substr((string) $date, 0, 10);
    }

    private function label(?string $label): ?string
    {
        $trimmed = trim((string) $label);

        return $trimmed === '' ? null : $trimmed;
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
