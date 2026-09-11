<?php

namespace App\Http\Requests;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Http\FormRequest;

class StoreAvailabilityWindowRequest extends FormRequest
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
            'starts_at' => ['required', 'date_format:Y-m-d H:i:s'],
        ];
    }
}
