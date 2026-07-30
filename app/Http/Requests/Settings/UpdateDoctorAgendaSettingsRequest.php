<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\Settings\Concerns\ValidatesWeeklyAvailability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateDoctorAgendaSettingsRequest extends FormRequest
{
    use ValidatesWeeklyAvailability;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge([
            'slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:120'],
        ], $this->weeklyAvailabilityRules(required: false));
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge([
            'slot_duration_minutes.required' => 'La duración del turno es obligatoria.',
            'slot_duration_minutes.integer' => 'La duración debe ser un número entero.',
            'slot_duration_minutes.min' => 'La duración mínima es de 5 minutos.',
            'slot_duration_minutes.max' => 'La duración máxima es de 120 minutos.',
        ], $this->weeklyAvailabilityMessages());
    }

    public function withValidator(Validator $validator): void
    {
        $this->validateWeeklyAvailabilityBands($validator);
    }
}
