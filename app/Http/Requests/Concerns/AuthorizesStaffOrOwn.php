<?php

namespace App\Http\Requests\Concerns;

use App\Enums\Permission;

trait AuthorizesStaffOrOwn
{
    protected function staffOrOwn(Permission $staff, Permission $own): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $this->routeIs('admin.*')
            ? $staff->allows($user)
            : $own->allows($user);
    }
}
