<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use App\Models\Specialty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSpecialtyRequest extends FormRequest
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
        /** @var Specialty $specialty */
        $specialty = $this->route('specialty');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('specialties', 'name')->ignore($specialty)],
            'doctor_ids' => ['sometimes', 'array'],
            'doctor_ids.*' => ['integer', 'distinct', 'exists:doctors,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.unique' => 'Ya existe una especialidad con ese nombre.',
            'name.max' => 'El nombre no puede superar los 255 caracteres.',
            'doctor_ids.array' => 'Los doctores asociados no son válidos.',
            'doctor_ids.*.integer' => 'El doctor seleccionado no existe.',
            'doctor_ids.*.distinct' => 'No repetí un doctor.',
            'doctor_ids.*.exists' => 'El doctor seleccionado no existe.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => trim((string) $this->input('name')),
            ]);
        }

        if ($this->exists('doctor_ids') && is_array($this->input('doctor_ids'))) {
            $this->merge([
                'doctor_ids' => array_values(array_map(intval(...), $this->input('doctor_ids'))),
            ]);
        }
    }
}
