<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Http\Requests\Concerns\AuthorizesStaffOrOwn;
use Illuminate\Foundation\Http\FormRequest;

class ProgramAvailabilityWindowsRequest extends FormRequest
{
    use AuthorizesStaffOrOwn;

    public function authorize(): bool
    {
        return $this->staffOrOwn(Permission::AvailabilityProgram, Permission::OwnAvailabilityProgram);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'dates' => ['required', 'array', 'min:1'],
            'dates.*' => ['required', 'date_format:Y-m-d'],
            'ranges' => ['required', 'array', 'min:1'],
            'ranges.*.start' => ['required', 'date_format:H:i'],
            'ranges.*.end' => ['required', 'date_format:H:i'],
            'block_weekends' => ['sometimes', 'boolean'],
        ];
    }
}
