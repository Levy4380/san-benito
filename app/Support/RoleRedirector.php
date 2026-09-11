<?php

namespace App\Support;

use App\Models\User;

class RoleRedirector
{
    public static function intendedPath(User $user): string
    {
        if ($user->hasRole(['admin', 'super_admin'])) {
            return '/admin/appointments';
        }

        return '/home';
    }
}
