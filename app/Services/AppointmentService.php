<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
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
        private readonly DoctorPatientService $links,
        private readonly PatientService $patients,
        private readonly DoctorService $doctors,
    ) {}

    public function book(User $actor, Doctor $doctor, string $startsAt): Appointment
    {
        $patient = $this->patients->forUser($actor);

        return $this->insertReservation($doctor, $patient, $startsAt);
    }

    public function assign(User $actor, Doctor $doctor, int $patientId, string $startsAt): Appointment
    {
        $this->doctors->forUser($actor);

        if (! $actor->doctor?->is($doctor)) {
            abort(403);
        }

        $patient = Patient::query()->findOrFail($patientId);

        if (! $this->links->isLinked($doctor, $patient)) {
            throw ValidationException::withMessages([
                'patient_id' => 'Solo podés asignar pacientes ya vinculados.',
            ]);
        }

        return $this->insertReservation($doctor, $patient, $startsAt);
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
    public function upcomingThisWeekForDoctor(Doctor $doctor): Collection
    {
        return $this->upcomingThisWeek(Appointment::query()->forDoctor($doctor));
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function upcomingForPatient(Patient $patient): Collection
    {
        return Appointment::query()
            ->forPatient($patient)
            ->upcoming()
            ->with(['doctor.user', 'doctor.specialty'])
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
            ->with(['doctor.user', 'doctor.specialty'])
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
            ->with(['doctor.user', 'doctor.specialty', 'patient.user'])
            ->where('starts_at', '>', now())
            ->whereBetween('starts_at', [$weekStart, $weekEnd])
            ->orderBy('starts_at')
            ->limit(3)
            ->get();
    }

    private function insertReservation(Doctor $doctor, Patient $patient, string $startsAt): Appointment
    {
        $start = Carbon::parse($startsAt);
        $end = $start->copy()->addMinutes((int) $doctor->slot_duration_minutes);

        if (! $this->availability->isBookableSlot($doctor, $start)) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno ya no está disponible',
            ]);
        }

        try {
            return DB::transaction(function () use ($doctor, $patient, $start, $end) {
                if (! $this->availability->isBookableSlot($doctor, $start)) {
                    throw ValidationException::withMessages([
                        'starts_at' => 'El turno ya no está disponible',
                    ]);
                }

                $appointment = Appointment::query()->create([
                    'doctor_id' => $doctor->id,
                    'patient_id' => $patient->id,
                    'starts_at' => $start,
                    'ends_at' => $end,
                ]);

                $this->links->link($doctor, $patient);

                return $appointment;
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno ya no está disponible',
            ]);
        }
    }
}
