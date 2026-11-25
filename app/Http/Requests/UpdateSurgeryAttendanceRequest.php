<?php

namespace App\Http\Requests;

use App\Enums\AppointmentAttendance;
use App\Models\Surgery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSurgeryAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $surgery = $this->route('surgery');

        return $surgery instanceof Surgery
            && (bool) $this->user()?->can('markAttendance', $surgery);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'attendance' => ['present', 'nullable', Rule::enum(AppointmentAttendance::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'attendance' => 'estado',
        ];
    }

    public function attendance(): ?AppointmentAttendance
    {
        $value = $this->validated('attendance');

        return is_string($value) ? AppointmentAttendance::from($value) : null;
    }
}
