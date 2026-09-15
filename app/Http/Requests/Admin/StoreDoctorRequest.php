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
        ];
    }
}
