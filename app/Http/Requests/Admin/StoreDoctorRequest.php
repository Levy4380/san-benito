<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::DoctorsCreate->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', Password::defaults()],
            'license_number' => ['required', 'string', 'max:64', 'unique:doctors,license_number'],
            'specialty_ids' => ['required', 'array', 'min:1'],
            'specialty_ids.*' => ['integer', 'distinct', 'exists:specialties,id'],
            'health_insurance_ids' => ['sometimes', 'array'],
            'health_insurance_ids.*' => ['integer', 'distinct', 'exists:health_insurances,id'],
            'phone' => ['nullable', 'string', 'max:32'],
            'slot_duration_minutes' => ['nullable', 'integer', 'min:5', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'specialty_ids.required' => 'Elegí al menos una especialidad.',
            'specialty_ids.array' => 'Elegí al menos una especialidad.',
            'specialty_ids.min' => 'Elegí al menos una especialidad.',
            'specialty_ids.*.integer' => 'La especialidad seleccionada no existe.',
            'specialty_ids.*.distinct' => 'No repetí una especialidad.',
            'specialty_ids.*.exists' => 'La especialidad seleccionada no existe.',
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
