<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAgendaSlotRequest extends FormRequest
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
            'mode' => ['required', Rule::in(['classic', 'range'])],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required_if:mode,range', 'nullable', 'date', 'after:starts_at'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mode.required' => 'Indicá el tipo de turno.',
            'mode.in' => 'El tipo de turno no es válido.',
            'starts_at.required' => 'La hora de inicio es obligatoria.',
            'ends_at.required_if' => 'La hora de fin es obligatoria para una franja.',
            'ends_at.after' => 'La hora de fin debe ser posterior a la de inicio.',
        ];
    }
}
