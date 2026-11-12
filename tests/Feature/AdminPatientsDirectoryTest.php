<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HealthInsurance;
use App\Models\User;
use App\Support\RoleRedirector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
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

    public function test_admin_professional_and_patient_cannot_access_patients_or_admins(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();

        foreach ([$patient->user, $professional->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/pacientes')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/patients/create')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/administradores')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/administradores/crear')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->post('/patients', [
                'name' => 'Nora Paciente',
                'email' => 'nora.admin@example.com',
                'password' => 'password',
                'dni' => '40111222',
                'birth_date' => '1995-04-10',
            ])->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->post('/admins', [
                'name' => 'Otro Admin',
                'email' => 'otro.admin@example.com',
                'password' => 'password',
                'role' => 'admin',
            ])->assertRedirect(RoleRedirector::landing($user));
        }
    }

    public function test_super_admin_creates_patient_without_logging_in_as_them(): void
    {
        $super = $this->makeSuperAdmin();
        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);

        $this->actingAs($super)
            ->getJson('/patients/create')
            ->assertOk()
            ->assertJsonStructure(['healthInsurances']);

        $this->actingAs($super)
            ->post('/patients', [
                'name' => 'Texto Libre',
                'email' => 'texto.admin@example.com',
                'password' => 'password',
                'dni' => '40111000',
                'birth_date' => '1995-04-10',
                'health_insurance_id' => 'OSDE',
            ])
            ->assertSessionHasErrors('health_insurance_id');

        $this->assertNull(User::query()->where('email', 'texto.admin@example.com')->first());

        $this->actingAs($super)
            ->post('/patients', [
                'with_account' => true,
                'name' => 'Nora Paciente',
                'email' => 'nora.admin@example.com',
                'password' => 'password',
                'dni' => '40111222',
                'birth_date' => '1995-04-10',
                'phone' => '1144445555',
                'health_insurance_id' => $osde->id,
            ])
            ->assertRedirect('/admin/pacientes');

        $this->assertAuthenticatedAs($super);

        $user = User::query()->where('email', 'nora.admin@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('patient'));
        $this->assertNotNull($user->patient);
        $this->assertSame('40111222', $user->patient->dni);
        $this->assertSame('Nora Paciente', $user->patient->name);
        $this->assertSame('nora.admin@example.com', $user->patient->email);
        $this->assertSame('1144445555', $user->patient->phone);
        $this->assertSame('OSDE', $user->patient->health_insurance);
        $this->assertDatabaseHas('patient_health_insurance', [
            'patient_id' => $user->patient->id,
            'health_insurance_id' => $osde->id,
        ]);
        $this->assertArrayNotHasKey('health_insurances', $user->patient->load('healthInsurances')->toArray());
    }

    public function test_admin_patient_create_rejects_duplicate_email_and_dni(): void
    {
        $super = $this->makeSuperAdmin();
        $existing = $this->makePatient(['email' => 'ya@example.com'], ['dni' => '33999888']);

        $this->actingAs($super)
            ->post('/patients', [
                'name' => 'Duplicado Mail',
                'email' => 'ya@example.com',
                'password' => 'password',
                'dni' => '40111223',
                'birth_date' => '1995-04-10',
            ])
            ->assertSessionHasErrors('email');

        $this->actingAs($super)
            ->post('/patients', [
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
            ->get('/admin/pacientes/'.$patient->id)
            ->assertOk()
            ->assertDontSee('Asignar turno')
            ->assertInertia(fn ($page) => $page
                ->component('Admin/UserPatient')
                ->where('patient.name', 'Luis Paciente')
                ->where('patient.dni', '33999888'));

        $this->actingAs($super)->get('/admin/pacientes/999999')->assertNotFound();
    }

    public function test_patient_profile_and_agenda_json_are_super_admin_only(): void
    {
        $this->travelTo(Carbon::parse('2026-10-07 10:30:00'));
        $super = $this->makeSuperAdmin();
        $admin = $this->makeAdmin();
        $patient = $this->makePatient(['name' => 'Nora Ficha']);
        $professional = $this->makeProfessional();

        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-07 11:00:00',
            'ends_at' => '2026-10-07 11:20:00',
        ]);

        $this->actingAs($admin)
            ->getJson('/patients/'.$patient->id)
            ->assertForbidden();

        $this->actingAs($super)
            ->getJson('/patients/'.$patient->id)
            ->assertOk()
            ->assertJsonPath('patient.name', 'Nora Ficha')
            ->assertJsonPath('patient.dni', $patient->dni);

        $this->actingAs($super)
            ->getJson('/patients/'.$patient->id.'/agenda')
            ->assertOk()
            ->assertJsonPath('selectedDate', '2026-10-07')
            ->assertJsonPath('bookingTones.2026-10-07', 'has')
            ->assertJsonCount(1, 'timeline.appointments')
            ->assertJsonPath('timeline.appointments.0.professional.user.name', $professional->user->name);

        $this->actingAs($super)->getJson('/patients/999999')->assertNotFound();
    }
}
