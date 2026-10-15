<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class StoreSurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::SurgeriesCreate->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'professional_id' => ['required', 'integer', 'exists:professionals,id'],
            'health_insurance_id' => ['nullable', 'integer', 'exists:health_insurances,id'],
            'note' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Elegí un paciente.',
            'patient_id.exists' => 'Elegí un paciente.',
            'professional_id.required' => 'Elegí un profesional.',
            'professional_id.exists' => 'Elegí un profesional.',
            'health_insurance_id.exists' => 'Esa obra social no existe.',
            'note.required' => 'La nota es obligatoria.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $insurance = $this->input('health_insurance_id');

        $this->merge([
            'note' => trim((string) $this->input('note', '')),
            'health_insurance_id' => $insurance === '' || $insurance === 'particular' || $insurance === null
                ? null
                : $insurance,
            'professional_id' => $this->input('professional_id') === '' ? null : $this->input('professional_id'),
            'patient_id' => $this->input('patient_id') === '' ? null : $this->input('patient_id'),
        ]);
    }
}
