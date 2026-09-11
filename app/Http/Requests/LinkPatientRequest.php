<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LinkPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['doctor', 'admin', 'super_admin']) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'q' => ['nullable', 'string', 'min:2'],
        ];
    }
}
