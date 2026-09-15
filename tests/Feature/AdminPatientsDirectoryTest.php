<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AdminPatientsDirectoryTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_admin_doctor_and_patient_cannot_access_patients_or_admins(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();

        foreach ([$patient->user, $doctor->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/patients')->assertForbidden();
            $this->actingAs($user)->get('/admin/patients/create')->assertForbidden();
            $this->actingAs($user)->get('/admin/admins')->assertForbidden();
            $this->actingAs($user)->get('/admin/admins/create')->assertForbidden();
            $this->actingAs($user)->post('/admin/patients', [
                'name' => 'Nora Paciente',
                'email' => 'nora.admin@example.com',
                'password' => 'password',
                'dni' => '40111222',
                'birth_date' => '1995-04-10',
            ])->assertForbidden();
            $this->actingAs($user)->post('/admin/admins', [
                'name' => 'Otro Admin',
                'email' => 'otro.admin@example.com',
                'password' => 'password',
                'role' => 'admin',
            ])->assertForbidden();
        }
    }

    public function test_super_admin_creates_patient_without_logging_in_as_them(): void
    {
        $super = $this->makeSuperAdmin();

        $this->actingAs($super)
            ->get('/admin/patients/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/PatientCreate'));

        $this->actingAs($super)
            ->post('/admin/patients', [
                'name' => 'Nora Paciente',
                'email' => 'nora.admin@example.com',
                'password' => 'password',
                'dni' => '40111222',
                'birth_date' => '1995-04-10',
                'phone' => '1144445555',
                'health_insurance' => 'OSDE',
            ])
            ->assertRedirect('/admin/patients');

        $this->assertAuthenticatedAs($super);

        $user = User::query()->where('email', 'nora.admin@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('patient'));
        $this->assertNotNull($user->patient);
        $this->assertSame('40111222', $user->patient->dni);
        $this->assertSame('OSDE', $user->patient->health_insurance);
    }

    public function test_admin_patient_create_rejects_duplicate_email_and_dni(): void
    {
        $super = $this->makeSuperAdmin();
        $existing = $this->makePatient(['email' => 'ya@example.com'], ['dni' => '33999888']);

        $this->actingAs($super)
            ->post('/admin/patients', [
                'name' => 'Duplicado Mail',
                'email' => 'ya@example.com',
                'password' => 'password',
                'dni' => '40111223',
                'birth_date' => '1995-04-10',
            ])
            ->assertSessionHasErrors('email');

        $this->actingAs($super)
            ->post('/admin/patients', [
                'name' => 'Duplicado Dni',
                'email' => 'otro@example.com',
                'password' => 'password',
                'dni' => $existing->dni,
                'birth_date' => '1995-04-10',
            ])
            ->assertSessionHasErrors('dni');

        $this->assertAuthenticatedAs($super);
        $this->assertNull(User::query()->where('email', 'otro@example.com')->first());
    }

    public function test_admin_patient_profile_hides_portal_ctas(): void
    {
        $super = $this->makeSuperAdmin();
        $patient = $this->makePatient(['name' => 'Luis Paciente'], ['dni' => '33999888']);

        $this->actingAs($super)
            ->get('/admin/patients/'.$patient->id)
            ->assertOk()
            ->assertDontSee('Asignar turno')
            ->assertInertia(fn ($page) => $page
                ->component('Admin/UserPatient')
                ->where('patient.user.name', 'Luis Paciente')
                ->where('patient.dni', '33999888'));

        $this->actingAs($super)->get('/admin/patients/999999')->assertNotFound();
    }
}
