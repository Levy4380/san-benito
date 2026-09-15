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

    public function test_create_and_associate_gets_follow_post_permissions(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();
        $super = $this->makeSuperAdmin();

        $this->actingAs($admin)->get('/admin/doctors/create')->assertOk();
        $this->actingAs($super)->get('/admin/doctors/create')->assertOk();
        $this->actingAs($admin)->get('/admin/admins/create')->assertForbidden();
        $this->actingAs($admin)->get('/admin/patients/create')->assertForbidden();
        $this->actingAs($super)->get('/admin/admins/create')->assertOk();
        $this->actingAs($super)->get('/admin/patients/create')->assertOk();
        $this->actingAs($super)->get('/admin/settings/specialties/create')->assertOk();
        $this->actingAs($admin)->get('/admin/settings/specialties/create')->assertForbidden();
        $this->actingAs($patient->user)->get('/doctors/'.$doctor->id.'/specialties')->assertForbidden();
        $this->actingAs($admin)->get('/doctors/'.$doctor->id.'/specialties')->assertForbidden();
        $this->actingAs($super)->get('/doctors/'.$doctor->id.'/specialties')->assertOk();
        $this->actingAs($doctor->user)->get('/doctors/'.$doctor->id.'/specialties')->assertForbidden();
    }
}
