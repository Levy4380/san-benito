<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class ScheduleSurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::SurgeriesSchedule->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date_format:Y-m-d H:i:s'],
            'ends_at' => ['required', 'date_format:Y-m-d H:i:s'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'starts_at.required' => 'Elegí la hora de inicio.',
            'starts_at.date_format' => 'Elegí la hora de inicio.',
            'ends_at.required' => 'Elegí la hora de fin.',
            'ends_at.date_format' => 'Elegí la hora de fin.',
        ];
    }
}
