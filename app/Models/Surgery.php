<?php

namespace App\Models;

use App\Enums\SurgeryStatus;
use App\Models\Concerns\SerializesInstitutionalDates;
use Database\Factories\SurgeryFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Surgery extends Model
{
    /** @use HasFactory<SurgeryFactory> */
    use HasFactory, SerializesInstitutionalDates;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'patient_id',
        'professional_id',
        'health_insurance_id',
        'requested_by_user_id',
        'status',
        'note',
        'starts_at',
        'ends_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => SurgeryStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    public function healthInsurance(): BelongsTo
    {
        return $this->belongsTo(HealthInsurance::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    /**
     * @param  Builder<Surgery>  $query
     * @return Builder<Surgery>
     */
    public function scopeInSection(Builder $query, string $section): Builder
    {
        return match ($section) {
            'requested' => $query->where('status', SurgeryStatus::Requested)->orderByDesc('id'),
            'approved' => $query
                ->where(function (Builder $approved): void {
                    $approved->where('status', SurgeryStatus::ToSchedule)
                        ->orWhere(function (Builder $scheduled): void {
                            $scheduled->where('status', SurgeryStatus::Scheduled)
                                ->where('ends_at', '>', now());
                        });
                })
                ->orderByRaw("case when status = 'to_schedule' then 0 else 1 end")
                ->orderByRaw("case when status = 'scheduled' then starts_at end")
                ->orderBy('id'),
            'history' => $query
                ->where('status', SurgeryStatus::Scheduled)
                ->where('ends_at', '<=', now())
                ->orderByDesc('starts_at'),
            default => $query->where('status', SurgeryStatus::Pending)->orderByDesc('id'),
        };
    }

    /**
     * @param  Builder<Surgery>  $query
     * @return Builder<Surgery>
     */
    public function scopeScheduledOnDate(Builder $query, string $date): Builder
    {
        return $query
            ->where('status', SurgeryStatus::Scheduled)
            ->whereDate('starts_at', $date)
            ->orderBy('starts_at');
    }

    /**
     * Scheduled rows whose interval touches the civil day, including those that start the day before.
     *
     * @param  Builder<Surgery>  $query
     * @return Builder<Surgery>
     */
    public function scopeScheduledTouchingDay(Builder $query, Carbon $dayStart, Carbon $dayEnd): Builder
    {
        return $query
            ->where('status', SurgeryStatus::Scheduled)
            ->where('starts_at', '<', $dayEnd)
            ->where('ends_at', '>', $dayStart)
            ->orderBy('id');
    }
}
