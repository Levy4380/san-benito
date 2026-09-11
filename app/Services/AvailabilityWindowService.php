<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AvailabilityWindowService
{
    public function createShortWindow(Doctor $doctor, string $startsAt): AvailabilityWindow
    {
        $start = Carbon::parse($startsAt);
        $end = $start->copy()->addMinutes((int) $doctor->slot_duration_minutes);

        $this->assertValidWindow($doctor, $start, $end);

        return AvailabilityWindow::query()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $end,
        ]);
    }

    /**
     * @param  list<string>  $dates  Y-m-d
     * @param  list<array{start: string, end: string}>  $ranges  HH:mm
     * @return list<AvailabilityWindow>
     */
    public function program(Doctor $doctor, array $dates, array $ranges, bool $blockWeekends): array
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
            $this->assertValidWindow($doctor, $window['starts_at'], $window['ends_at']);

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

        return DB::transaction(function () use ($doctor, $planned) {
            $created = [];

            foreach ($planned as $window) {
                $created[] = AvailabilityWindow::query()->create([
                    'doctor_id' => $doctor->id,
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
            ->forDoctor($window->doctor_id)
            ->overlapping($window->starts_at, $window->ends_at)
            ->exists();

        if ($hasAppointments) {
            throw ValidationException::withMessages([
                'window' => 'No se puede borrar la franja porque tiene turnos reservados.',
            ]);
        }

        $window->delete();
    }

    public function assertOwnedBy(User $user, Doctor $doctor): void
    {
        if ($user->hasRole(['admin', 'super_admin'])) {
            return;
        }

        if ($user->hasRole('doctor') && $user->doctor?->is($doctor)) {
            return;
        }

        abort(403);
    }

    private function assertValidWindow(Doctor $doctor, Carbon $start, Carbon $end): void
    {
        if (! $end->gt($start)) {
            throw ValidationException::withMessages([
                'starts_at' => 'La franja debe terminar después de comenzar.',
            ]);
        }

        $minutes = (int) $start->diffInMinutes($end, false);

        if ($minutes < (int) $doctor->slot_duration_minutes) {
            throw ValidationException::withMessages([
                'ends_at' => 'Cada franja debe admitir al menos un turno.',
            ]);
        }

        $overlaps = AvailabilityWindow::query()
            ->forDoctor($doctor)
            ->overlapping($start, $end)
            ->exists();

        if ($overlaps) {
            throw ValidationException::withMessages([
                'starts_at' => 'La franja se solapa con otra ya cargada.',
            ]);
        }
    }
}
