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
        $this->makeProfessional();
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
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();
        $super = $this->makeSuperAdmin();

        $this->actingAs($admin)->get('/professionals/create')->assertOk();
        $this->actingAs($super)->get('/professionals/create')->assertOk();
        $this->actingAs($admin)->get('/admin/administradores/crear')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/patients/create')->assertRedirect('/admin');
        $this->actingAs($super)->get('/admin/administradores/crear')->assertOk();
        $this->actingAs($super)->get('/patients/create')->assertOk();
        $this->actingAs($super)->get('/admin/configuracion/especialidades/crear')->assertOk();
        $this->actingAs($admin)->get('/admin/configuracion/especialidades/crear')->assertRedirect('/admin');
        $this->actingAs($patient->user)->get('/admin/profesionales/'.$professional->id.'/especialidades')->assertRedirect('/paciente');
        $this->actingAs($admin)->get('/admin/profesionales/'.$professional->id.'/especialidades')->assertRedirect('/admin');
        $this->actingAs($super)->get('/admin/profesionales/'.$professional->id.'/especialidades')->assertOk();
        $this->actingAs($professional->user)->get('/admin/profesionales/'.$professional->id.'/especialidades')->assertRedirect('/profesional');
    }
}
