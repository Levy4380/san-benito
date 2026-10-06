<?php

namespace App\Http\Requests\Auth;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $dni = Rule::unique(Patient::class, 'dni');
        $chartId = $this->unattachedChartId();

        if ($chartId !== null) {
            $dni->ignore($chartId);
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class),
                Rule::unique(Patient::class, 'email')->where(
                    fn ($query) => $query->whereNotNull('user_id'),
                ),
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
            'dni' => ['required', 'string', 'max:32', $dni],
            'birth_date' => ['required', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:32'],
            'health_insurance_id' => ['nullable', 'integer', 'exists:health_insurances,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'email' => 'correo',
            'password' => 'contraseña',
            'dni' => 'DNI',
            'birth_date' => 'fecha de nacimiento',
            'phone' => 'teléfono',
            'health_insurance_id' => 'obra social',
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

    private function unattachedChartId(): ?int
    {
        $email = $this->input('email');

        if (! is_string($email) || $email === '') {
            return null;
        }

        $id = Patient::query()
            ->where('email', Str::lower($email))
            ->whereNull('user_id')
            ->value('id');

        return $id === null ? null : (int) $id;
    }
}
