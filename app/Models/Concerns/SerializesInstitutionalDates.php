<?php

namespace App\Models\Concerns;

use DateTimeInterface;

trait SerializesInstitutionalDates
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }
}
