<?php

namespace App\Policies;

use App\Models\AvailabilityWindow;
use App\Models\User;

class AvailabilityWindowPolicy
{
    public function create(User $user): bool
    {
        return $user->can('own.availability.create') || $user->can('availability.create');
    }

    public function delete(User $user, AvailabilityWindow $window): bool
    {
        if ($user->can('availability.delete')) {
            return true;
        }

        return $user->can('own.availability.delete') && $user->doctor?->id === $window->doctor_id;
    }
}
