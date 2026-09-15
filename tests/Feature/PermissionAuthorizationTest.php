<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class PermissionAuthorizationTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_roles_sync_permissions_without_direct_user_grants(): void
    {
        $this->makePatient();
        $this->makeDoctor();
        $this->makeAdmin();
        $this->makeSuperAdmin();

        $this->assertSame(4, Role::query()->where('guard_name', 'web')->count());
        $this->assertGreaterThan(0, Permission::query()->where('guard_name', 'web')->count());
        $this->assertGreaterThan(0, DB::table('role_has_permissions')->count());
        $this->assertSame(0, DB::table('model_has_permissions')->count());
        $this->assertDatabaseHas('permissions', ['name' => 'portal.home', 'guard_name' => 'web']);
    }
}
