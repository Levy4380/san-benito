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
            'professional_ids' => ['sometimes', 'array'],
            'professional_ids.*' => ['integer', 'distinct', 'exists:professionals,id'],
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
            'professional_ids.array' => 'Los profesionales asociados no son válidos.',
            'professional_ids.*.integer' => 'El profesional seleccionado no existe.',
            'professional_ids.*.distinct' => 'No repetí un profesional.',
            'professional_ids.*.exists' => 'El profesional seleccionado no existe.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => trim((string) $this->input('name')),
            ]);
        }

        if ($this->exists('professional_ids') && is_array($this->input('professional_ids'))) {
            $this->merge([
                'professional_ids' => array_values(array_map(intval(...), $this->input('professional_ids'))),
            ]);
        }
    }
}
