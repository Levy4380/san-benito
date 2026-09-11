<?php

namespace App\Policies;

use App\Models\AvailabilityWindow;
use App\Models\User;

class AvailabilityWindowPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole(['doctor', 'admin', 'super_admin']);
    }

    public function delete(User $user, AvailabilityWindow $window): bool
    {
        if ($user->hasRole(['admin', 'super_admin'])) {
            return true;
        }

        return $user->hasRole('doctor') && $user->doctor?->id === $window->doctor_id;
    }
}
