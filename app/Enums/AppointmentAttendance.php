<?php

namespace App\Enums;

/**
 * Explicit mark on a reservation that already started (staff or the professional of the agenda).
 */
enum AppointmentAttendance: string
{
    case Attended = 'attended';
    case Absent = 'absent';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
