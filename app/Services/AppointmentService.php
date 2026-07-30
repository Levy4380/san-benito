<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private DoctorPatientService $doctorPatientService,
    ) {}

    public function availableSlotsForDoctor(Doctor $doctor)
    {
        return Appointment::query()
            ->available()
            ->forDoctor($doctor->id)
            ->orderBy('starts_at')
            ->get();
    }

    public function upcomingForPatient(Patient $patient)
    {
        return Appointment::query()
            ->booked()
            ->forPatient($patient->id)
            ->upcoming()
            ->with(['doctor.user', 'doctor.specialty'])
            ->orderBy('starts_at')
            ->get();
    }

    public function upcomingForDoctor(Doctor $doctor)
    {
        return Appointment::query()
            ->forDoctor($doctor->id)
            ->upcoming()
            ->with(['patient.user'])
            ->orderBy('starts_at')
            ->get();
    }

    /**
     * @param  array{doctor_id?: int|null, patient_id?: int|null, date?: string|null}  $filters
     */
    public function listForAdmin(array $filters)
    {
        return Appointment::query()
            ->with(['doctor.user', 'patient.user'])
            ->when(! empty($filters['doctor_id']), fn ($q) => $q->where('doctor_id', $filters['doctor_id']))
            ->when(! empty($filters['patient_id']), fn ($q) => $q->where('patient_id', $filters['patient_id']))
            ->when(! empty($filters['date']), fn ($q) => $q->whereDate('starts_at', $filters['date']))
            ->orderByDesc('starts_at')
            ->paginate(20)
            ->withQueryString();
    }

    /**
     * @param  array{starts_at: string, ends_at?: string}  $data
     */
    public function createSlot(Doctor $doctor, array $data): Appointment
    {
        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = isset($data['ends_at'])
            ? Carbon::parse($data['ends_at'])
            : $startsAt->copy()->addMinutes($doctor->slot_duration_minutes);

        $this->assertValidSlotWindow($doctor, $startsAt, $endsAt);

        return $this->insertAvailableSlot($doctor, $startsAt, $endsAt);
    }

    /**
     * Split a time range into complete slots of the doctor's duration.
     * Incomplete remainder at the end of the range is discarded.
     *
     * @return Collection<int, Appointment>
     */
    public function createSlotsFromRange(Doctor $doctor, Carbon $rangeStart, Carbon $rangeEnd): Collection
    {
        if ($rangeStart->lte(now())) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno debe ser en el futuro.',
            ]);
        }

        if ($rangeEnd->lte($rangeStart)) {
            throw ValidationException::withMessages([
                'ends_at' => 'La hora de fin debe ser posterior a la de inicio.',
            ]);
        }

        $duration = $doctor->slot_duration_minutes;
        $windows = [];
        $cursor = $rangeStart->copy();

        while ($cursor->copy()->addMinutes($duration)->lte($rangeEnd)) {
            $slotEnd = $cursor->copy()->addMinutes($duration);
            $windows[] = [$cursor->copy(), $slotEnd];
            $cursor = $slotEnd;
        }

        if ($windows === []) {
            throw ValidationException::withMessages([
                'ends_at' => 'La franja es más corta que la duración configurada del turno.',
            ]);
        }

        foreach ($windows as [$startsAt, $endsAt]) {
            $this->assertValidSlotWindow($doctor, $startsAt, $endsAt);
        }

        return DB::transaction(function () use ($doctor, $windows) {
            $created = new Collection;

            foreach ($windows as [$startsAt, $endsAt]) {
                $created->push($this->insertAvailableSlot($doctor, $startsAt, $endsAt));
            }

            return $created;
        });
    }

    public function book(Appointment $appointment, Patient $patient): Appointment
    {
        if ($appointment->starts_at->lte(now())) {
            throw new DomainException('El turno ya no está disponible.');
        }

        return DB::transaction(function () use ($appointment, $patient) {
            $affected = DB::table('appointments')
                ->where('id', $appointment->id)
                ->where('status', Appointment::STATUS_AVAILABLE)
                ->update([
                    'patient_id' => $patient->id,
                    'status' => Appointment::STATUS_BOOKED,
                    'updated_at' => now(),
                ]);

            if ($affected === 0) {
                throw new DomainException('El turno ya no está disponible.');
            }

            $appointment->refresh();

            $doctor = Doctor::query()->findOrFail($appointment->doctor_id);
            $this->doctorPatientService->link($doctor, $patient);

            return $appointment;
        });
    }

    public function cancel(Appointment $appointment): Appointment
    {
        if ($appointment->status !== Appointment::STATUS_BOOKED) {
            throw ValidationException::withMessages([
                'appointment' => 'Solo se pueden cancelar turnos reservados.',
            ]);
        }

        if ($appointment->starts_at->lte(now())) {
            throw ValidationException::withMessages([
                'appointment' => 'No se pueden cancelar turnos pasados.',
            ]);
        }

        $appointment->update([
            'patient_id' => null,
            'status' => Appointment::STATUS_AVAILABLE,
        ]);

        return $appointment->refresh();
    }

    public function deleteSlot(Appointment $appointment): void
    {
        if ($appointment->status !== Appointment::STATUS_AVAILABLE) {
            throw ValidationException::withMessages([
                'appointment' => 'Solo se pueden eliminar turnos disponibles. Cancelá el turno reservado primero.',
            ]);
        }

        $appointment->delete();
    }

    private function assertValidSlotWindow(Doctor $doctor, Carbon $startsAt, Carbon $endsAt): void
    {
        if ($startsAt->lte(now())) {
            throw ValidationException::withMessages([
                'starts_at' => 'El turno debe ser en el futuro.',
            ]);
        }

        if ($endsAt->lte($startsAt)) {
            throw ValidationException::withMessages([
                'ends_at' => 'La hora de fin debe ser posterior a la de inicio.',
            ]);
        }

        $overlaps = Appointment::query()
            ->forDoctor($doctor->id)
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($overlaps) {
            throw ValidationException::withMessages([
                'starts_at' => 'El horario se solapa con otro turno del mismo doctor.',
            ]);
        }
    }

    private function insertAvailableSlot(Doctor $doctor, Carbon $startsAt, Carbon $endsAt): Appointment
    {
        return Appointment::query()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => Appointment::STATUS_AVAILABLE,
        ]);
    }
}
