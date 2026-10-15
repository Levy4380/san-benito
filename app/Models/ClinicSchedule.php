<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicSchedule extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'open_days',
        'opens_at',
        'closes_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'open_days' => 'array',
        ];
    }
}
