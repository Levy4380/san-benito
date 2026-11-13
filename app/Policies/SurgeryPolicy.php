<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Surgery;
use App\Models\User;

class SurgeryPolicy
{
    public function viewAny(User $user): bool
    {
        return Permission::SurgeriesCatalogView->allows($user)
            || Permission::OwnSurgeriesView->allows($user);
    }

    public function view(User $user, Surgery $surgery): bool
    {
        if (Permission::SurgeriesCatalogView->allows($user)) {
            return true;
        }

        return Permission::OwnSurgeriesView->allows($user)
            && $user->professional?->id === $surgery->professional_id;
    }

    public function create(User $user): bool
    {
        if (Permission::SurgeriesCreate->allows($user)) {
            return true;
        }

        return Permission::OwnSurgeriesCreate->allows($user)
            && $user->professional !== null;
    }

    public function markRequested(User $user, Surgery $surgery): bool
    {
        return Permission::SurgeriesRequest->allows($user);
    }

    public function approve(User $user, Surgery $surgery): bool
    {
        return Permission::SurgeriesApprove->allows($user);
    }

    public function schedule(User $user, Surgery $surgery): bool
    {
        if (Permission::SurgeriesSchedule->allows($user)) {
            return true;
        }

        return Permission::OwnSurgeriesSchedule->allows($user)
            && $user->professional?->id === $surgery->professional_id;
    }
}
