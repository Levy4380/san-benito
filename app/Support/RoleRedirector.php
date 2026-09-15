<?php

namespace App\Support;

use App\Enums\Permission;
use App\Models\User;

class RoleRedirector
{
    public static function intendedPath(User $user): string
    {
        if (Permission::PortalHome->allows($user)) {
            return '/home';
        }

        return '/admin/appointments';
    }
}
