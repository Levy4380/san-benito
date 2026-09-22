<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientHealthInsuranceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::HealthInsurancesManage->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'health_insurance_id' => ['present', 'nullable', 'integer', 'exists:health_insurances,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'health_insurance_id.present' => 'La obra social seleccionada no existe.',
            'health_insurance_id.integer' => 'La obra social seleccionada no existe.',
            'health_insurance_id.exists' => 'La obra social seleccionada no existe.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->exists('health_insurance_id')) {
            return;
        }

        $value = $this->input('health_insurance_id');

        if ($value === null || $value === '') {
            $this->merge([
                'health_insurance_id' => null,
            ]);
        }
    }
}
