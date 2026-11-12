<?php

namespace App\Enums;

enum SurgeryStatus: string
{
    case Pending = 'pending';
    case Requested = 'requested';
    case ToSchedule = 'to_schedule';
    case Scheduled = 'scheduled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente de aprobación',
            self::Requested => 'Solicitada',
            self::ToSchedule => 'A programar',
            self::Scheduled => 'Programada',
        };
    }
}
