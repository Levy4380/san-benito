<?php

namespace App\Services;

use App\Enums\Permission;
use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Professional;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AvailabilityWindowService
{
    public function createShortWindow(Professional $professional, string $startsAt): AvailabilityWindow
    {
        $start = Carbon::parse($startsAt);
        $end = $start->copy()->addMinutes((int) $professional->slot_duration_minutes);

        $this->assertValidWindow($professional, $start, $end);

        return AvailabilityWindow::query()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $end,
        ]);
    }

    /**
     * @param  list<string>  $dates  Y-m-d
     * @param  list<array{start: string, end: string}>  $ranges  HH:mm
     * @return list<AvailabilityWindow>
     */
    public function program(Professional $professional, array $dates, array $ranges, bool $blockWeekends): array
    {
        $dates = collect($dates)
            ->map(fn (string $date) => Carbon::parse($date)->toDateString())
            ->unique()
            ->values();

        $today = now()->toDateString();
        $past = $dates->filter(fn (string $date) => $date < $today)->values();

        if ($past->isNotEmpty()) {
            $named = $past
                ->map(fn (string $date) => Carbon::parse($date)->format('d/m/Y'))
                ->implode(', ');

            throw ValidationException::withMessages([
                'dates' => 'No se puede programar un día anterior a hoy: '.$named.'.',
            ]);
        }

        if ($blockWeekends) {
            $dates = $dates->reject(function (string $date) {
                $day = Carbon::parse($date);

                return $day->isSaturday() || $day->isSunday();
            })->values();
        }

        if ($dates->isEmpty()) {
            throw ValidationException::withMessages([
                'dates' => 'No quedan días para programar.',
            ]);
        }

        $planned = [];

        foreach ($dates as $date) {
            foreach ($ranges as $range) {
                $start = Carbon::parse($date.' '.$range['start']);
                $end = Carbon::parse($date.' '.$range['end']);
                $planned[] = ['starts_at' => $start, 'ends_at' => $end];
            }
        }

        foreach ($planned as $window) {
            $this->assertWindowSpan($professional, $window['starts_at'], $window['ends_at']);
        }

        $this->assertDaysAreFree($professional, $dates->all());

        foreach ($planned as $index => $window) {
            foreach ($planned as $otherIndex => $other) {
                if ($otherIndex <= $index) {
                    continue;
                }

                if ($window['starts_at']->toDateString() !== $other['starts_at']->toDateString()) {
                    continue;
                }

                if ($window['starts_at']->lt($other['ends_at']) && $window['ends_at']->gt($other['starts_at'])) {
                    throw ValidationException::withMessages([
                        'ranges' => sprintf(
                            'El %s las franjas %s–%s y %s–%s se solapan. Ajustá esos horarios para que no se pisen.',
                            $window['starts_at']->format('d/m/Y'),
                            $window['starts_at']->format('H:i'),
                            $window['ends_at']->format('H:i'),
                            $other['starts_at']->format('H:i'),
                            $other['ends_at']->format('H:i'),
                        ),
                    ]);
                }
            }
        }

        return DB::transaction(function () use ($professional, $planned) {
            $created = [];

            foreach ($planned as $window) {
                $created[] = AvailabilityWindow::query()->create([
                    'professional_id' => $professional->id,
                    'starts_at' => $window['starts_at'],
                    'ends_at' => $window['ends_at'],
                ]);
            }

            return $created;
        });
    }

    public function delete(AvailabilityWindow $window): void
    {
        $hasAppointments = Appointment::query()
            ->forProfessional($window->professional_id)
            ->overlapping($window->starts_at, $window->ends_at)
            ->exists();

        if ($hasAppointments) {
            throw ValidationException::withMessages([
                'window' => 'No se puede borrar la franja porque tiene turnos reservados.',
            ]);
        }

        $window->delete();
    }

    public function assertOwnedBy(User $user, Professional $professional, Permission $ability): void
    {
        if ($ability->allows($user)) {
            return;
        }

        $own = $ability->own();

        if ($own !== null && $own->allows($user) && $user->professional?->is($professional)) {
            return;
        }

        abort(403);
    }

    /**
     * @param  list<string>  $dates
     */
    private function assertDaysAreFree(Professional $professional, array $dates): void
    {
        $start = Carbon::parse(min($dates))->startOfDay();
        $end = Carbon::parse(max($dates))->endOfDay();

        $windows = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($start, $end)
            ->orderBy('starts_at')
            ->get();

        $appointments = Appointment::query()
            ->forProfessional($professional)
            ->whereBetween('starts_at', [$start, $end])
            ->orderBy('starts_at')
            ->get();

        $problems = [];

        foreach ($dates as $date) {
            $day = Carbon::parse($date)->startOfDay();
            $dayEnd = $day->copy()->endOfDay();
            $dayWindows = $windows->filter(
                fn (AvailabilityWindow $window) => $window->starts_at->lt($dayEnd) && $window->ends_at->gt($day),
            );
            $dayAppointments = $appointments->filter(
                fn (Appointment $appointment) => $appointment->starts_at->toDateString() === $day->toDateString(),
            );

            if ($dayWindows->isEmpty() && $dayAppointments->isEmpty()) {
                continue;
            }

            $parts = [];

            if ($dayWindows->isNotEmpty()) {
                $parts[] = 'franjas '.$dayWindows
                    ->map(fn (AvailabilityWindow $window) => $window->starts_at->format('H:i').'–'.$window->ends_at->format('H:i'))
                    ->implode(', ');
            }

            if ($dayAppointments->isNotEmpty()) {
                $parts[] = 'turnos '.$dayAppointments
                    ->map(fn (Appointment $appointment) => $appointment->starts_at->format('H:i').'–'.$appointment->ends_at->format('H:i'))
                    ->implode(', ');
            }

            $problems[] = $day->format('d/m/Y').' ('.implode('; ', $parts).')';
        }

        if ($problems !== []) {
            throw ValidationException::withMessages([
                'dates' => 'Estos días ya tienen carga y no se pueden programar: '.implode('; ', $problems).'. Elegí días sin franjas ni turnos.',
            ]);
        }
    }

    private function assertValidWindow(Professional $professional, Carbon $start, Carbon $end): void
    {
        $this->assertWindowSpan($professional, $start, $end);

        $overlap = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($start, $end)
            ->orderBy('starts_at')
            ->first();

        if ($overlap instanceof AvailabilityWindow) {
            throw ValidationException::withMessages([
                'starts_at' => sprintf(
                    'La franja %s–%s del %s se solapa con la ya cargada %s–%s del %s.',
                    $start->format('H:i'),
                    $end->format('H:i'),
                    $start->format('d/m/Y'),
                    $overlap->starts_at->format('H:i'),
                    $overlap->ends_at->format('H:i'),
                    $overlap->starts_at->format('d/m/Y'),
                ),
            ]);
        }
    }

    private function assertWindowSpan(Professional $professional, Carbon $start, Carbon $end): void
    {
        if (! $end->gt($start)) {
            throw ValidationException::withMessages([
                'starts_at' => sprintf(
                    'La franja del %s tiene que terminar después de las %s.',
                    $start->format('d/m/Y'),
                    $start->format('H:i'),
                ),
            ]);
        }

        $minutes = (int) $start->diffInMinutes($end, false);

        app(ClinicScheduleService::class)->assertWindow($start, $end);

        if ($minutes < (int) $professional->slot_duration_minutes) {
            throw ValidationException::withMessages([
                'ends_at' => sprintf(
                    'La franja %s–%s del %s dura %d min y cada turno es de %d min.',
                    $start->format('H:i'),
                    $end->format('H:i'),
                    $start->format('d/m/Y'),
                    $minutes,
                    (int) $professional->slot_duration_minutes,
                ),
            ]);
        }
    }
}
