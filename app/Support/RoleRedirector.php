<?php

namespace App\Support;

use App\Models\User;

class RoleRedirector
{
    public static function intendedPath(User $user): string
    {
        if ($user->can('portal.home')) {
            return '/home';
        }

        return '/admin/appointments';
    }
}
