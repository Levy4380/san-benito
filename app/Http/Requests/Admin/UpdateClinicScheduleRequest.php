<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicScheduleRequest extends FormRequest
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
            'open_days' => ['required', 'array', 'min:1'],
            'open_days.*' => ['integer', 'distinct', 'between:1,7'],
            'opens_at' => ['required', 'date_format:H:i'],
            'closes_at' => ['required', 'date_format:H:i', 'after:opens_at'],
        ];
    }
}
