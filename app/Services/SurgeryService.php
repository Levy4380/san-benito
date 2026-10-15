<?php

namespace App\Services;

use App\Enums\Permission;
use App\Enums\SurgeryStatus;
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
        if (! Permission::SurgeriesCreate->allows($actor)) {
            abort(403);
        }

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

    public function markRequested(User $actor, Surgery $surgery): Surgery
    {
        if (! Permission::SurgeriesRequest->allows($actor)) {
            abort(403);
        }

        if ($surgery->status !== SurgeryStatus::Pending || $surgery->health_insurance_id === null) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede marcar como solicitada una cirugía pendiente de obra social.',
            ]);
        }

        $surgery->status = SurgeryStatus::Requested;
        $surgery->save();

        return $surgery;
    }

    public function approve(User $actor, Surgery $surgery): Surgery
    {
        if (! Permission::SurgeriesApprove->allows($actor)) {
            abort(403);
        }

        if ($surgery->status !== SurgeryStatus::Requested) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede aprobar una cirugía solicitada.',
            ]);
        }

        $surgery->status = SurgeryStatus::ToSchedule;
        $surgery->starts_at = null;
        $surgery->ends_at = null;
        $surgery->save();

        return $surgery;
    }

    public function schedule(User $actor, Surgery $surgery, string $startsAt, string $endsAt): Surgery
    {
        if (! Permission::SurgeriesSchedule->allows($actor)) {
            abort(403);
        }

        return DB::transaction(function () use ($surgery, $startsAt, $endsAt): Surgery {
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
}
