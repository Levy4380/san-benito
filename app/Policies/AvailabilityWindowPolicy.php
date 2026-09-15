<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\AvailabilityWindow;
use App\Models\User;

class AvailabilityWindowPolicy
{
    public function create(User $user): bool
    {
        return Permission::OwnAvailabilityCreate->allows($user)
            || Permission::AvailabilityCreate->allows($user);
    }

    public function delete(User $user, AvailabilityWindow $window): bool
    {
        if (Permission::AvailabilityDelete->allows($user)) {
            return true;
        }

        return Permission::OwnAvailabilityDelete->allows($user)
            && $user->doctor?->id === $window->doctor_id;
    }
}
