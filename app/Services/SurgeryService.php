<?php

namespace App\Services;

use App\Enums\SurgeryStatus;
use App\Models\ClinicSchedule;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Surgery;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SurgeryService
{
    public function request(User $actor, int $patientId, int $professionalId, ?int $healthInsuranceId, string $note): Surgery
    {
        $note = trim($note);

        if ($note === '') {
            throw ValidationException::withMessages([
                'note' => 'La nota es obligatoria.',
            ]);
        }

        if (! Patient::query()->whereKey($patientId)->exists()) {
            throw ValidationException::withMessages([
                'patient_id' => 'Elegí un paciente.',
            ]);
        }

        if (! Professional::query()->whereKey($professionalId)->exists()) {
            throw ValidationException::withMessages([
                'professional_id' => 'Elegí un profesional.',
            ]);
        }

        if ($healthInsuranceId !== null && ! HealthInsurance::query()->whereKey($healthInsuranceId)->exists()) {
            throw ValidationException::withMessages([
                'health_insurance_id' => 'Esa obra social no existe.',
            ]);
        }

        return Surgery::query()->create([
            'patient_id' => $patientId,
            'professional_id' => $professionalId,
            'health_insurance_id' => $healthInsuranceId,
            'requested_by_user_id' => $actor->id,
            'status' => $healthInsuranceId === null ? SurgeryStatus::ToSchedule : SurgeryStatus::Pending,
            'note' => $note,
            'starts_at' => null,
            'ends_at' => null,
        ]);
    }

    public function markRequested(Surgery $surgery): Surgery
    {
        return DB::transaction(function () use ($surgery): Surgery {
            $locked = Surgery::query()->whereKey($surgery->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== SurgeryStatus::Pending || $locked->health_insurance_id === null) {
                throw ValidationException::withMessages([
                    'status' => 'Solo se puede marcar como solicitada una cirugía pendiente de obra social.',
                ]);
            }

            $locked->status = SurgeryStatus::Requested;
            $locked->save();

            return $locked;
        });
    }

    public function approve(Surgery $surgery): Surgery
    {
        return DB::transaction(function () use ($surgery): Surgery {
            $locked = Surgery::query()->whereKey($surgery->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== SurgeryStatus::Requested) {
                throw ValidationException::withMessages([
                    'status' => 'Solo se puede aprobar una cirugía solicitada.',
                ]);
            }

            $locked->status = SurgeryStatus::ToSchedule;
            $locked->starts_at = null;
            $locked->ends_at = null;
            $locked->save();

            return $locked;
        });
    }

    public function schedule(Surgery $surgery, string $startsAt, string $endsAt): Surgery
    {
        return DB::transaction(function () use ($surgery, $startsAt, $endsAt): Surgery {
            $this->lockOperatingRoom();

            $locked = Surgery::query()->whereKey($surgery->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== SurgeryStatus::ToSchedule) {
                throw ValidationException::withMessages([
                    'status' => 'Solo se puede programar una cirugía a programar.',
                ]);
            }

            $start = Carbon::parse($startsAt);
            $end = Carbon::parse($endsAt);

            if ($end->lte($start)) {
                throw ValidationException::withMessages([
                    'ends_at' => 'La hora de fin tiene que ser posterior a la de inicio.',
                ]);
            }

            if ($start->toDateString() !== $end->toDateString()) {
                throw ValidationException::withMessages([
                    'ends_at' => 'El horario tiene que terminar el mismo día.',
                ]);
            }

            if ($start->diffInMinutes($end) < 30) {
                throw ValidationException::withMessages([
                    'ends_at' => 'La cirugía tiene que durar al menos 30 minutos.',
                ]);
            }

            if ($start->lte(now())) {
                throw ValidationException::withMessages([
                    'starts_at' => 'Ese horario ya pasó. Programá un horario futuro.',
                ]);
            }

            $dayStart = $start->copy()->startOfDay();
            $dayEnd = $start->copy()->endOfDay();

            $busy = Surgery::query()
                ->with('patient')
                ->scheduledTouchingDay($dayStart, $dayEnd)
                ->lockForUpdate()
                ->get();

            $clash = $busy->first(function (Surgery $other) use ($start, $end): bool {
                return $other->starts_at !== null
                    && $other->ends_at !== null
                    && $other->starts_at->lt($end)
                    && $start->lt($other->ends_at);
            });

            if ($clash !== null && $clash->starts_at !== null && $clash->ends_at !== null) {
                throw ValidationException::withMessages([
                    'starts_at' => sprintf(
                        'Se solapa con %s–%s (%s).',
                        $clash->starts_at->format('H:i'),
                        $clash->ends_at->format('H:i'),
                        $clash->patient?->name ?? 'otra cirugía',
                    ),
                ]);
            }

            $locked->status = SurgeryStatus::Scheduled;
            $locked->starts_at = $start;
            $locked->ends_at = $end;
            $locked->save();

            return $locked;
        });
    }

    /**
     * Serializes institutional scheduling. A lock of scheduled rows does not
     * block anything when that day has none, so two overlapping writes can both pass.
     * The single clinic_schedules row is the sentinel for the operating room.
     */
    private function lockOperatingRoom(): void
    {
        $schedule = ClinicSchedule::query()->orderBy('id')->lockForUpdate()->first();

        if ($schedule instanceof ClinicSchedule) {
            return;
        }

        app(ClinicScheduleService::class)->current();
        ClinicSchedule::query()->orderBy('id')->lockForUpdate()->first();
    }
}
