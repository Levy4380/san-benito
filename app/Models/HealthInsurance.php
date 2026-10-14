<?php

namespace App\Models;

use Database\Factories\HealthInsuranceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class HealthInsurance extends Model
{
    /** @use HasFactory<HealthInsuranceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
    ];

    public function professionals(): BelongsToMany
    {
        return $this->belongsToMany(Professional::class, 'professional_health_insurance')->withTimestamps();
    }

    public function patients(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, 'patient_health_insurance')->withTimestamps();
    }
}
