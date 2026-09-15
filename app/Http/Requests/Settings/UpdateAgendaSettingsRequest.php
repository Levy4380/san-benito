<?php

namespace App\Http\Requests\Settings;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAgendaSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Permission::OwnAgendaSettingsUpdate->allows($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:120'],
        ];
    }
}
