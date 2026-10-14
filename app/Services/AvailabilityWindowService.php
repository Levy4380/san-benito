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

        foreach ($planned as $index => $window) {
            $this->assertValidWindow($professional, $window['starts_at'], $window['ends_at']);

            foreach ($planned as $otherIndex => $other) {
                if ($otherIndex === $index) {
                    continue;
                }

                if ($window['starts_at']->lt($other['ends_at']) && $window['ends_at']->gt($other['starts_at'])) {
                    throw ValidationException::withMessages([
                        'ranges' => 'La franja se solapa con otra ya cargada.',
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

    private function assertValidWindow(Professional $professional, Carbon $start, Carbon $end): void
    {
        if (! $end->gt($start)) {
            throw ValidationException::withMessages([
                'starts_at' => 'La franja debe terminar después de comenzar.',
            ]);
        }

        $minutes = (int) $start->diffInMinutes($end, false);

        if ($minutes < (int) $professional->slot_duration_minutes) {
            throw ValidationException::withMessages([
                'ends_at' => 'Cada franja debe admitir al menos un turno.',
            ]);
        }

        $overlaps = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($start, $end)
            ->exists();

        if ($overlaps) {
            throw ValidationException::withMessages([
                'starts_at' => 'La franja se solapa con otra ya cargada.',
            ]);
        }
    }
}
