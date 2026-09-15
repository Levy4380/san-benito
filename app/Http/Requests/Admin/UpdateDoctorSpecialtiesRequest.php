<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorSpecialtiesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::SpecialtiesManage->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'specialty_ids' => ['present', 'array'],
            'specialty_ids.*' => ['integer', 'distinct', 'exists:specialties,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'specialty_ids.present' => 'Las especialidades no son válidas.',
            'specialty_ids.array' => 'Las especialidades no son válidas.',
            'specialty_ids.*.integer' => 'La especialidad seleccionada no existe.',
            'specialty_ids.*.distinct' => 'No repetí una especialidad.',
            'specialty_ids.*.exists' => 'La especialidad seleccionada no existe.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('specialty_ids') && is_array($this->input('specialty_ids'))) {
            $this->merge([
                'specialty_ids' => array_values(array_map(intval(...), $this->input('specialty_ids'))),
            ]);
        }
    }
}
