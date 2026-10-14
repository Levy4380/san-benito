<?php

namespace App\Support;

use App\Enums\Permission;
use App\Models\User;

class RoleRedirector
{
    public static function home(User $user): string
    {
        return self::landing($user);
    }

    public static function landing(User $user): string
    {
        if (Permission::PortalHome->allows($user)) {
            if ($user->hasRole('professional')) {
                return '/profesional';
            }

            if ($user->hasRole('patient')) {
                return '/paciente';
            }
        }

        return '/admin';
    }
}
