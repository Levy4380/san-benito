<?php

namespace App\Enums;

/**
 * Displayed status of a reservation. `scheduled` / `past` are derived from `starts_at`;
 * `attended` / `absent` come from the explicit `appointments.attendance` mark.
 */
enum AppointmentStatus: string
{
    case Scheduled = 'scheduled';
    case Past = 'past';
    case Attended = 'attended';
    case Absent = 'absent';

    /**
     * Hours after `starts_at` that an unmarked reservation still shows as scheduled (same-day delays).
     */
    public const PAST_GRACE_HOURS = 24;

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Programado',
            self::Past => 'Pasado',
            self::Attended => 'Atendido',
            self::Absent => 'Ausente',
        };
    }
}
