<?php

namespace App\Support;

use App\Enums\Permission;
use App\Models\User;

class RoleRedirector
{
    public static function home(): string
    {
        return '/';
    }

    public static function landing(User $user): string
    {
        if (Permission::PortalHome->allows($user)) {
            return self::home();
        }

        return '/admin/appointments';
    }
}
