<?php

namespace App\Support;

use App\Models\User;

class RoleRedirector
{
    public static function home(User $user): string
    {
        if ($user->hasRole('patient')) {
            return route('doctors.index', absolute: false);
        }

        if ($user->hasRole('doctor')) {
            return route('agenda.index', absolute: false);
        }

        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            return route('admin.appointments.index', absolute: false);
        }

        return route('dashboard', absolute: false);
    }
}
