<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorHealthInsurancesRequest extends FormRequest
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
            'health_insurance_ids' => ['present', 'array'],
            'health_insurance_ids.*' => ['integer', 'distinct', 'exists:health_insurances,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'health_insurance_ids.present' => 'Las obras sociales no son válidas.',
            'health_insurance_ids.array' => 'Las obras sociales no son válidas.',
            'health_insurance_ids.*.integer' => 'La obra social seleccionada no existe.',
            'health_insurance_ids.*.distinct' => 'No repetí una obra social.',
            'health_insurance_ids.*.exists' => 'La obra social seleccionada no existe.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('health_insurance_ids') && is_array($this->input('health_insurance_ids'))) {
            $this->merge([
                'health_insurance_ids' => array_values(array_map(intval(...), $this->input('health_insurance_ids'))),
            ]);
        }
    }
}
