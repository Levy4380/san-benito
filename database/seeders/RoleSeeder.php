<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * @var array<string, list<string>>
     */
    private const ROLE_PERMISSIONS = [
        'patient' => [
            'portal.home',
            'doctors.browse',
            'appointments.book',
            'own.appointments.view',
            'own.appointments.cancel',
        ],
        'doctor' => [
            'portal.home',
            'own.appointments.cancel',
            'own.agenda.view',
            'own.appointments.assign',
            'own.patients.view',
            'own.patients.link',
            'own.agenda.settings.update',
            'own.availability.create',
            'own.availability.program',
            'own.availability.delete',
        ],
        'admin' => [
            'doctors.browse',
            'appointments.cancel',
            'patients.link',
            'availability.create',
            'availability.program',
            'availability.delete',
            'appointments.view-all',
            'doctors.catalog.view',
            'doctors.create',
        ],
        'super_admin' => [
            'doctors.browse',
            'appointments.cancel',
            'patients.link',
            'availability.create',
            'availability.program',
            'availability.delete',
            'appointments.view-all',
            'doctors.catalog.view',
            'doctors.create',
            'staff.admins.manage',
            'staff.users.directory',
            'patients.create',
            'specialties.manage',
        ],
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $names = collect(self::ROLE_PERMISSIONS)->flatten()->unique()->values();

        foreach ($names as $name) {
            Permission::findOrCreate($name, 'web');
        }

        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            Role::findOrCreate($role, 'web')->syncPermissions($permissions);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
