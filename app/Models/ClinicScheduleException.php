<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicScheduleException extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'date',
        'closed',
        'opens_at',
        'closes_at',
        'label',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'closed' => 'boolean',
        ];
    }
}
