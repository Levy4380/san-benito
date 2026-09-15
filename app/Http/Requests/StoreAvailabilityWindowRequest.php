<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Http\Requests\Concerns\AuthorizesStaffOrOwn;
use Illuminate\Foundation\Http\FormRequest;

class StoreAvailabilityWindowRequest extends FormRequest
{
    use AuthorizesStaffOrOwn;

    public function authorize(): bool
    {
        return $this->staffOrOwn(Permission::AvailabilityCreate, Permission::OwnAvailabilityCreate);
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
