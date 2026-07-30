<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\Settings\Concerns\ValidatesWeeklyAvailability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GenerateDoctorAgendaRequest extends FormRequest
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
            'target' => ['required', Rule::in(['current', 'next', 'after_next'])],
        ], $this->weeklyAvailabilityRules(required: true));
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge([
            'target.required' => 'Debés indicar el mes a generar.',
            'target.in' => 'El mes debe ser el actual, el siguiente o el posterior.',
        ], $this->weeklyAvailabilityMessages());
    }

    public function withValidator(Validator $validator): void
    {
        $this->validateWeeklyAvailabilityBands($validator);
    }
}
