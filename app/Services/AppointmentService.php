<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly ProfessionalPatientService $links,
        private readonly PatientService $patients,
        private readonly ProfessionalService $professionals,
    ) {}

    public function book(User $actor, Professional $professional, string $startsAt, int $specialtyId): Appointment
    {
        $patient = $this->patients->forUser($actor);
        $this->assertSpecialtyOfProfessional($professional, $specialtyId);

        $requested = Carbon::parse($startsAt);
        $dayStart = $requested->copy()->startOfDay();
        $dayEnd = $requested->copy()->endOfDay();

        try {
            return DB::transaction(function () use ($professional, $patient, $requested, $dayStart, $dayEnd, $specialtyId) {
                AvailabilityWindow::query()
                    ->forProfessional($professional)
                    ->overlapping($dayStart, $dayEnd)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                $first = $this->availability->nextOfferableSlotPerDay($professional, $dayStart, $dayEnd)->first();

                if (! is_array($first)) {
                    throw ValidationException::withMessages([
                        'starts_at' => 'El turno ya no está disponible',
                    ]);
                }

                $firstStart = Carbon::parse($first['starts_at']);

                if ($requested->gt($firstStart)) {
                    throw ValidationException::withMessages([
                        'starts_at' => 'El turno ya no está disponible',
                    ]);
                }

                $candidates = $this->availability->calculateSlots($professional, $dayStart, $dayEnd);

                foreach ($candidates as $slot) {
                    $start = Carbon::parse($slot['starts_at']);
                    $end = $start->copy()->addMinutes((int) $professional->slot_duration_minutes);

                    try {
                        $appointment = Appointment::query()->create([
                            'professional_id' => $professional->id,
                            'patient_id' => $patient->id,
                            'specialty_id' => $specialtyId,
                            'starts_at' => $start,
                            'ends_at' => $end,
                        ]);

                        $this->links->link($professional, $patient);

                        return $appointment;
                    } catch (UniqueConstraintViolationException) {
                        continue;
                    }
                }

                throw ValidationException::withMessages([
                    'starts_at' => 'El turno ya no está disponible',
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno ya no está disponible',
            ]);
        }
    }

    public function assign(User $actor, Professional $professional, int $patientId, string $startsAt, int $specialtyId): Appointment
    {
        $this->professionals->forUser($actor);

        if (! $actor->professional?->is($professional)) {
            abort(403);
        }

        $patient = Patient::query()->findOrFail($patientId);

        if (! $this->links->isLinked($professional, $patient)) {
            throw ValidationException::withMessages([
                'patient_id' => 'Solo podés asignar pacientes ya vinculados.',
            ]);
        }

        return $this->insertReservation($professional, $patient, $startsAt, $specialtyId);
    }

    /**
     * Staff books any calculated slot of any professional for any patient; the professional_patient link is created if missing.
     */
    public function assignAsStaff(Professional $professional, int $patientId, string $startsAt, int $specialtyId): Appointment
    {
        $patient = Patient::query()->findOrFail($patientId);

        return $this->insertReservation($professional, $patient, $startsAt, $specialtyId);
    }

    public function cancel(Appointment $appointment): void
    {
        if (! $appointment->starts_at->gt(now())) {
            throw ValidationException::withMessages([
                'appointment' => 'No se puede cancelar un turno que ya comenzó.',
            ]);
        }

        $appointment->delete();
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function upcomingThisWeekForPatient(Patient $patient): Collection
    {
        return $this->upcomingThisWeek(Appointment::query()->forPatient($patient));
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function upcomingThisWeekForProfessional(Professional $professional): Collection
    {
        return $this->upcomingThisWeek(Appointment::query()->forProfessional($professional));
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function upcomingForPatient(Patient $patient): Collection
    {
        return Appointment::query()
            ->forPatient($patient)
            ->upcoming()
            ->with(['professional.user', 'professional.specialties', 'specialty'])
            ->get();
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function pastForPatient(Patient $patient): Collection
    {
        return Appointment::query()
            ->forPatient($patient)
            ->past()
            ->with(['professional.user', 'professional.specialties', 'specialty'])
            ->get();
    }

    /**
     * @param  Builder<Appointment>  $query
     * @return Collection<int, Appointment>
     */
    private function upcomingThisWeek($query): Collection
    {
        $weekStart = now()->startOfWeek(Carbon::MONDAY);
        $weekEnd = now()->endOfWeek(Carbon::SUNDAY);

        return $query
            ->with(['professional.user', 'professional.specialties', 'patient.user', 'specialty'])
            ->where('starts_at', '>', now())
            ->whereBetween('starts_at', [$weekStart, $weekEnd])
            ->orderBy('starts_at')
            ->limit(3)
            ->get();
    }

    private function insertReservation(Professional $professional, Patient $patient, string $startsAt, int $specialtyId): Appointment
    {
        $this->assertSpecialtyOfProfessional($professional, $specialtyId);

        $start = Carbon::parse($startsAt);
        $end = $start->copy()->addMinutes((int) $professional->slot_duration_minutes);

        if (! $this->availability->isBookableSlot($professional, $start)) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno ya no está disponible',
            ]);
        }

        try {
            return DB::transaction(function () use ($professional, $patient, $start, $end, $specialtyId) {
                if (! $this->availability->isBookableSlot($professional, $start)) {
                    throw ValidationException::withMessages([
                        'starts_at' => 'El turno ya no está disponible',
                    ]);
                }

                $appointment = Appointment::query()->create([
                    'professional_id' => $professional->id,
                    'patient_id' => $patient->id,
                    'specialty_id' => $specialtyId,
                    'starts_at' => $start,
                    'ends_at' => $end,
                ]);

                $this->links->link($professional, $patient);

                return $appointment;
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno ya no está disponible',
            ]);
        }
    }

    private function assertSpecialtyOfProfessional(Professional $professional, int $specialtyId): void
    {
        if ($professional->specialties()->whereKey($specialtyId)->exists()) {
            return;
        }

        throw ValidationException::withMessages([
            'specialty_id' => 'La especialidad no corresponde a este profesional.',
        ]);
    }
}
