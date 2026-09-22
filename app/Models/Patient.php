<?php

namespace App\Models;

use App\Models\Concerns\SerializesInstitutionalDates;
use Database\Factories\PatientFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    /** @use HasFactory<PatientFactory> */
    use HasFactory, SerializesInstitutionalDates;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'dni',
        'birth_date',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'health_insurance',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'healthInsurances',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function doctors(): BelongsToMany
    {
        return $this->belongsToMany(Doctor::class, 'doctor_patient')->withTimestamps();
    }

    public function healthInsurances(): BelongsToMany
    {
        return $this->belongsToMany(HealthInsurance::class, 'patient_health_insurance')->withTimestamps();
    }

    /**
     * @return Attribute<?string, never>
     */
    protected function healthInsurance(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->healthInsurances->first()?->name);
    }
}
