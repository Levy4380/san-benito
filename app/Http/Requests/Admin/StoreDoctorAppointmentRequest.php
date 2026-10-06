<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::AppointmentsAssign->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date_format:Y-m-d H:i:s'],
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'specialty_id' => ['required', 'integer', 'exists:specialties,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'starts_at' => 'horario',
            'patient_id' => 'paciente',
            'specialty_id' => 'especialidad',
        ];
    }
}
