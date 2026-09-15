<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Http\Requests\Concerns\AuthorizesStaffOrOwn;
use Illuminate\Foundation\Http\FormRequest;

class LinkPatientRequest extends FormRequest
{
    use AuthorizesStaffOrOwn;

    public function authorize(): bool
    {
        return $this->staffOrOwn(Permission::PatientsLink, Permission::OwnPatientsLink);
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
