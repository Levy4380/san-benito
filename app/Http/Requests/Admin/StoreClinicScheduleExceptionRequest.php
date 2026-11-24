<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class StoreClinicScheduleExceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::ClinicManage->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d', 'unique:clinic_schedule_exceptions,date'],
            'closed' => ['required', 'boolean'],
            'opens_at' => ['required_if:closed,false', 'nullable', 'date_format:H:i'],
            'closes_at' => ['required_if:closed,false', 'nullable', 'date_format:H:i', 'after:opens_at'],
            'label' => ['nullable', 'string', 'max:80'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.required' => 'Elegí el día.',
            'date.date_format' => 'Elegí el día.',
            'date.unique' => 'Ese día ya tiene una excepción.',
            'opens_at.required_if' => 'Indicá a qué hora abre.',
            'closes_at.required_if' => 'Indicá a qué hora cierra.',
            'closes_at.after' => 'El cierre tiene que ser posterior a la apertura.',
            'label.max' => 'El motivo no puede pasar de 80 caracteres.',
        ];
    }
}
