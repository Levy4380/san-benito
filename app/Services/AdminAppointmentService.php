<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AdminAppointmentService
{
    /**
     * @param  array{doctor_id?: int|null, patient_id?: int|null, specialty_id?: int|null, date?: string|null}  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with(['doctor.user', 'doctor.specialties', 'patient.user', 'specialty'])
            ->orderBy('starts_at');

        if (! empty($filters['doctor_id'])) {
            $query->forDoctor((int) $filters['doctor_id']);
        }

        if (! empty($filters['patient_id'])) {
            $query->forPatient((int) $filters['patient_id']);
        }

        if (! empty($filters['specialty_id'])) {
            $query->where('specialty_id', (int) $filters['specialty_id']);
        }

        if (! empty($filters['date'])) {
            $query->whereDate('starts_at', $filters['date']);
        }

        return $query->paginate(25)->withQueryString();
    }

    /**
     * @return array{doctors: Collection<int, Doctor>, patients: Collection<int, Patient>, specialties: Collection<int, Specialty>}
     */
    public function filterOptions(): array
    {
        return [
            'doctors' => Doctor::query()->with('user')->orderBy('id')->get(),
            'patients' => Patient::query()->with('user')->orderBy('id')->get(),
            'specialties' => Specialty::query()->orderBy('name')->get(),
        ];
    }
}
