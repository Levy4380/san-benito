<?php

namespace App\Models;

use App\Models\Concerns\SerializesInstitutionalDates;
use Database\Factories\AvailabilityWindowFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class AvailabilityWindow extends Model
{
    /** @use HasFactory<AvailabilityWindowFactory> */
    use HasFactory, SerializesInstitutionalDates;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'doctor_id',
        'starts_at',
        'ends_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * @param  Builder<AvailabilityWindow>  $query
     * @return Builder<AvailabilityWindow>
     */
    public function scopeForDoctor(Builder $query, Doctor|int $doctor): Builder
    {
        $doctorId = $doctor instanceof Doctor ? $doctor->id : $doctor;

        return $query->where('doctor_id', $doctorId);
    }

    /**
     * @param  Builder<AvailabilityWindow>  $query
     * @return Builder<AvailabilityWindow>
     */
    public function scopeOverlapping(Builder $query, Carbon|string $start, Carbon|string $end): Builder
    {
        return $query
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start);
    }

    /**
     * @param  Builder<AvailabilityWindow>  $query
     * @return Builder<AvailabilityWindow>
     */
    public function scopeOnDate(Builder $query, Carbon|string $date): Builder
    {
        $day = Carbon::parse($date)->toDateString();

        return $query->whereDate('starts_at', $day);
    }
}
