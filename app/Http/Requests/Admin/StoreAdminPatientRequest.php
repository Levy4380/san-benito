<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
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
            'with_account' => ['boolean'],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class),
                Rule::unique(Patient::class, 'email'),
            ],
            'password' => [
                Rule::excludeIf(fn (): bool => ! $this->boolean('with_account')),
                'required',
                Password::defaults(),
            ],
            'dni' => ['required', 'string', 'max:32', 'unique:patients,dni'],
            'birth_date' => ['required', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:32'],
            'health_insurance_id' => ['nullable', 'integer', 'exists:health_insurances,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'health_insurance_id.integer' => 'La obra social seleccionada no existe.',
            'health_insurance_id.exists' => 'La obra social seleccionada no existe.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'with_account' => $this->boolean('with_account'),
        ];

        if ($this->exists('health_insurance_id')) {
            $value = $this->input('health_insurance_id');

            if ($value === null || $value === '') {
                $merge['health_insurance_id'] = null;
            }
        }

        $this->merge($merge);
    }
}
