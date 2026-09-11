<?php

namespace App\Http\Requests;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Http\FormRequest;

class ProgramAvailabilityWindowsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', AvailabilityWindow::class) ?? false;
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
