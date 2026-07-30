<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorAgendaSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slot_duration_minutes.required' => 'La duración del turno es obligatoria.',
            'slot_duration_minutes.integer' => 'La duración debe ser un número entero.',
            'slot_duration_minutes.min' => 'La duración mínima es de 5 minutos.',
            'slot_duration_minutes.max' => 'La duración máxima es de 120 minutos.',
        ];
    }
}
