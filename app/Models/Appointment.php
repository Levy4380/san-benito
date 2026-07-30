<?php

namespace App\Models;

use Database\Factories\AppointmentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Appointment extends Model
{
    /** @use HasFactory<AppointmentFactory> */
    use HasFactory;

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_BOOKED = 'booked';

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * Wall-clock institution time (no UTC "Z"). Frontend must not timezone-shift this.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return Carbon::instance($date)
            ->timezone(config('app.timezone'))
            ->format('Y-m-d\TH:i:s');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_AVAILABLE)
            ->where('starts_at', '>', now());
    }

    public function scopeBooked(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_BOOKED);
    }

    public function scopeForDoctor(Builder $query, int $doctorId): Builder
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeForPatient(Builder $query, int $patientId): Builder
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('starts_at', '>', now());
    }
}
