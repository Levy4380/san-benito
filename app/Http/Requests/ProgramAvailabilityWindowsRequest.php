<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProgramAvailabilityWindowsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        if ($this->routeIs('admin.*')) {
            return $user->can('availability.program');
        }

        return $user->can('own.availability.program');
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
