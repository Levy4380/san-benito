<?php

namespace App\Services;

use App\Enums\Permission as AppPermission;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSyncService
{
    /**
     * Align Spatie permission catalog and role packages with App\Enums\Permission.
     *
     * @return array{permissions: int, roles: int}
     */
    public function sync(): array
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $names = AppPermission::names();

        foreach ($names as $name) {
            Permission::findOrCreate($name, 'web');
        }

        Permission::query()
            ->where('guard_name', 'web')
            ->whereNotIn('name', $names)
            ->delete();

        $roles = AppPermission::roles();

        foreach ($roles as $role) {
            Role::findOrCreate($role, 'web')->syncPermissions(AppPermission::namesForRole($role));
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return [
            'permissions' => count($names),
            'roles' => count($roles),
        ];
    }
}
