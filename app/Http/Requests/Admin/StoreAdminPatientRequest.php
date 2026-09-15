<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreAdminPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::PatientsCreate->allows($this->user());
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
            'dni' => ['required', 'string', 'max:32', 'unique:patients,dni'],
            'birth_date' => ['required', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:32'],
            'health_insurance' => ['nullable', 'string', 'max:255'],
        ];
    }
}
