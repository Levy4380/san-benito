<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Enums\SurgeryStatus;
use App\Models\Surgery;
use App\Models\User;

class SurgeryPolicy
{
    public function viewAny(User $user): bool
    {
        return Permission::SurgeriesCatalogView->allows($user);
    }

    public function create(User $user): bool
    {
        return Permission::SurgeriesCreate->allows($user);
    }

    public function markRequested(User $user, Surgery $surgery): bool
    {
        return Permission::SurgeriesRequest->allows($user)
            && $surgery->status === SurgeryStatus::Pending;
    }

    public function approve(User $user, Surgery $surgery): bool
    {
        return Permission::SurgeriesApprove->allows($user)
            && $surgery->status === SurgeryStatus::Requested;
    }

    public function schedule(User $user, Surgery $surgery): bool
    {
        return Permission::SurgeriesSchedule->allows($user)
            && $surgery->status === SurgeryStatus::ToSchedule;
    }
}
