<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['admin', 'super_admin']) ?? false;
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
            'specialty_id' => ['required', 'integer', 'exists:specialties,id'],
            'phone' => ['nullable', 'string', 'max:32'],
            'slot_duration_minutes' => ['nullable', 'integer', 'min:5', 'max:120'],
        ];
    }
}
