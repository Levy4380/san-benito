<?php

namespace App\Http\Requests\Professional;

use App\Models\Patient;
use App\Models\Surgery;
use App\Services\ProfessionalPatientService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreSurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Surgery::class) ?? false;
    }

    /**
     * @return array<string, list<string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
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
            'health_insurance_id.exists' => 'Esa obra social no existe.',
            'note.required' => 'La nota es obligatoria.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $professional = $this->user()?->professional;
            $patient = Patient::query()->find((int) $this->input('patient_id'));

            if ($professional === null || $patient === null) {
                $validator->errors()->add(
                    'patient_id',
                    'Solo podés solicitar cirugías para pacientes ya vinculados.',
                );

                return;
            }

            if (! app(ProfessionalPatientService::class)->isLinked($professional, $patient)) {
                $validator->errors()->add(
                    'patient_id',
                    'Solo podés solicitar cirugías para pacientes ya vinculados.',
                );
            }
        });
    }

    protected function prepareForValidation(): void
    {
        $this->request->remove('professional_id');

        $insurance = $this->input('health_insurance_id');

        $this->merge([
            'note' => trim((string) $this->input('note', '')),
            'health_insurance_id' => $insurance === '' || $insurance === 'particular' || $insurance === null
                ? null
                : $insurance,
            'patient_id' => $this->input('patient_id') === '' ? null : $this->input('patient_id'),
        ]);
    }
}
