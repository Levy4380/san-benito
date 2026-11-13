<?php

namespace Database\Seeders;

use App\Enums\Permission as AppPermission;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
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

        foreach (AppPermission::roles() as $role) {
            Role::findOrCreate($role, 'web')->syncPermissions(AppPermission::namesForRole($role));
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
