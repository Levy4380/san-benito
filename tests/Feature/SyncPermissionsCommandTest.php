<?php

namespace Tests\Feature;

use App\Enums\Permission as AppPermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SyncPermissionsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_permissions_sync_aligns_spatie_catalog_and_role_packages(): void
    {
        $this->seedCatalog();

        Permission::query()->where('name', 'own.surgeries.view')->delete();
        Role::findByName('professional', 'web')->revokePermissionTo('own.surgeries.create');

        $this->artisan('permissions:sync')
            ->expectsOutputToContain('Permisos sincronizados')
            ->assertSuccessful();

        foreach (['own.surgeries.view', 'own.surgeries.create', 'own.surgeries.schedule'] as $name) {
            $this->assertTrue(Permission::query()->where('name', $name)->where('guard_name', 'web')->exists());
            $this->assertTrue(Role::findByName('professional', 'web')->hasPermissionTo($name));
        }

        $professional = User::factory()->create();
        $professional->assignRole('professional');

        $this->assertTrue($professional->can(AppPermission::OwnSurgeriesView->value));
        $this->assertFalse($professional->can(AppPermission::SurgeriesCatalogView->value));
    }
}
