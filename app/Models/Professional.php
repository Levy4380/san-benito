<?php

namespace App\Models;

use App\Models\Concerns\SerializesInstitutionalDates;
use Database\Factories\ProfessionalFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Professional extends Model
{
    /** @use HasFactory<ProfessionalFactory> */
    use HasFactory, SerializesInstitutionalDates;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'license_number',
        'slot_duration_minutes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'slot_duration_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(Specialty::class, 'professional_specialty')
            ->withTimestamps()
            ->orderBy('specialties.name');
    }

    public function healthInsurances(): BelongsToMany
    {
        return $this->belongsToMany(HealthInsurance::class, 'professional_health_insurance')
            ->withTimestamps()
            ->orderBy('health_insurances.name');
    }

    public function availabilityWindows(): HasMany
    {
        return $this->hasMany(AvailabilityWindow::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function patients(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, 'professional_patient')->withTimestamps();
    }

    /**
     * @param  Builder<Professional>  $query
     */
    public function scopeForSpecialty(Builder $query, int $specialtyId): void
    {
        $query->whereHas('specialties', function (Builder $specialties) use ($specialtyId): void {
            $specialties->whereKey($specialtyId);
        });
    }

    /**
     * @param  Builder<Professional>  $query
     */
    public function scopeWithSpecialties(Builder $query): void
    {
        $query->whereHas('specialties');
    }
}
