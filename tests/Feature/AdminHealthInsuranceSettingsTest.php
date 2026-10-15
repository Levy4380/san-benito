<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HealthInsurance;
use App\Models\Specialty;
use App\Models\User;
use App\Support\RoleRedirector;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AdminHealthInsuranceSettingsTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_schema_replaces_the_patient_string_column(): void
    {
        $this->assertFalse(Schema::hasColumn('patients', 'health_insurance'));
        $this->assertTrue(Schema::hasTable('health_insurances'));
        $this->assertTrue(Schema::hasTable('professional_health_insurance'));
        $this->assertTrue(Schema::hasTable('patient_health_insurance'));
    }

    public function test_a_patient_cannot_attach_a_second_health_insurance(): void
    {
        $patient = $this->makePatient();
        $first = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $second = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $patient->healthInsurances()->attach($first->id);

        try {
            $patient->healthInsurances()->attach($second->id);
            $this->fail('A second health insurance must violate unique(patient_id).');
        } catch (QueryException) {
            $this->assertSame([$first->id], $patient->fresh()->healthInsurances()->pluck('health_insurances.id')->all());
        }
    }

    public function test_patient_professional_and_admin_cannot_manage_health_insurances(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();
        $healthInsurance = HealthInsurance::factory()->create(['name' => 'OSDE']);

        foreach ([$patient->user, $professional->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/configuracion/obras-sociales')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/obras-sociales/crear')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/obras-sociales/'.$healthInsurance->id.'/editar')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->post('/health-insurances', ['name' => 'Galeno'])->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->patch('/health-insurances/'.$healthInsurance->id, ['name' => 'Renombrada'])->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->delete('/health-insurances/'.$healthInsurance->id)->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/profesionales/'.$professional->id.'/obras-sociales')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->patch('/professionals/'.$professional->id.'/health-insurances', [
                'health_insurance_ids' => [$healthInsurance->id],
            ])->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->patch('/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => $healthInsurance->id,
            ])->assertRedirect(RoleRedirector::landing($user));
        }

        $this->assertDatabaseHas('health_insurances', [
            'id' => $healthInsurance->id,
            'name' => 'OSDE',
        ]);
    }

    public function test_super_admin_creates_renames_and_deletes_health_insurances(): void
    {
        $super = $this->makeSuperAdmin();

        $this->actingAs($super)
            ->get('/admin/configuracion')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Settings'));

        $this->actingAs($super)
            ->get('/admin/configuracion/obras-sociales')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/HealthInsurances')
                ->has('healthInsurances'));

        $this->actingAs($super)
            ->getJson('/admin/configuracion/obras-sociales/crear')
            ->assertOk()
            ->assertExactJson([]);

        $this->actingAs($super)
            ->post('/health-insurances', ['name' => '  Galeno  '])
            ->assertRedirect('/admin/configuracion/obras-sociales');

        $this->assertDatabaseHas('health_insurances', ['name' => 'Galeno']);

        $created = HealthInsurance::query()->where('name', 'Galeno')->firstOrFail();

        $this->actingAs($this->makeAdmin())
            ->post('/professionals', [
                'name' => 'Carla Ruiz',
                'email' => 'carla@example.com',
                'password' => 'password',
                'license_number' => 'MN-88888',
                'specialty_ids' => [Specialty::query()->firstOrFail()->id],
                'health_insurance_ids' => [$created->id],
            ])
            ->assertRedirect();

        $professional = User::query()->where('email', 'carla@example.com')->first()?->professional;
        $this->assertNotNull($professional);
        $this->assertDatabaseHas('professional_health_insurance', [
            'professional_id' => $professional->id,
            'health_insurance_id' => $created->id,
        ]);

        $this->actingAs($this->makeAdmin())
            ->post('/professionals', [
                'name' => 'Sin Obra',
                'email' => 'sinobra@example.com',
                'password' => 'password',
                'license_number' => 'MN-88889',
                'specialty_ids' => [Specialty::query()->firstOrFail()->id],
                'health_insurance_ids' => [],
            ])
            ->assertRedirect();

        $without = User::query()->where('email', 'sinobra@example.com')->first()?->professional;
        $this->assertNotNull($without);
        $this->assertTrue($without->healthInsurances()->doesntExist());

        $this->actingAs($super)
            ->post('/health-insurances', ['name' => 'Galeno'])
            ->assertSessionHasErrors('name');

        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);

        $this->actingAs($super)
            ->get('/admin/configuracion/obras-sociales/'.$osde->id.'/editar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/HealthInsuranceEdit')
                ->where('healthInsurance.id', $osde->id)
                ->where('healthInsurance.name', 'OSDE')
                ->has('professionals'));

        $this->actingAs($super)
            ->patch('/health-insurances/'.$osde->id, ['name' => 'OSDE 210'])
            ->assertRedirect('/admin/configuracion/obras-sociales');

        $this->assertDatabaseHas('health_insurances', [
            'id' => $osde->id,
            'name' => 'OSDE 210',
        ]);

        $this->actingAs($super)
            ->patch('/health-insurances/'.$osde->id, ['name' => 'Galeno'])
            ->assertSessionHasErrors('name');

        $unused = HealthInsurance::factory()->create(['name' => 'Temporal']);

        $this->actingAs($super)
            ->delete('/health-insurances/'.$unused->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('health_insurances', ['id' => $unused->id]);
    }

    public function test_super_admin_deletes_insurance_and_detaches_without_touching_appointments(): void
    {
        $super = $this->makeSuperAdmin();
        $removed = HealthInsurance::factory()->create(['name' => 'En uso']);
        $kept = HealthInsurance::factory()->create(['name' => 'Se queda']);
        $specialty = Specialty::factory()->create(['name' => 'Clínica extra']);
        $professional = $this->makeProfessional(['name' => 'Ana Vinculada'], ['specialty_id' => $specialty->id]);
        $patient = $this->makePatient(['name' => 'Nora Vinculada']);
        $professional->healthInsurances()->sync([$removed->id, $kept->id]);
        $patient->healthInsurances()->sync([$removed->id]);
        $appointment = Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'specialty_id' => $specialty->id,
        ]);

        $this->actingAs($super)
            ->delete('/health-insurances/'.$removed->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('health_insurances', ['id' => $removed->id]);
        $this->assertDatabaseMissing('professional_health_insurance', ['health_insurance_id' => $removed->id]);
        $this->assertDatabaseMissing('patient_health_insurance', ['health_insurance_id' => $removed->id]);
        $this->assertDatabaseHas('professional_health_insurance', [
            'professional_id' => $professional->id,
            'health_insurance_id' => $kept->id,
        ]);
        $this->assertNotNull($professional->fresh());
        $this->assertNotNull($patient->fresh());
        $this->assertNotNull($professional->user()->first());
        $this->assertNotNull($patient->user()->first());
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_super_admin_syncs_associated_professionals_and_can_leave_zero(): void
    {
        $super = $this->makeSuperAdmin();
        $healthInsurance = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $other = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $assigned = $this->makeProfessional(['name' => 'Ana Asignada']);
        $candidate = $this->makeProfessional(['name' => 'Luis Candidato']);
        $assigned->healthInsurances()->sync([$healthInsurance->id, $other->id]);

        $this->actingAs($super)
            ->patch('/health-insurances/'.$healthInsurance->id, [
                'name' => 'OSDE',
                'professional_ids' => [$candidate->id],
            ])
            ->assertRedirect('/admin/configuracion/obras-sociales');

        $this->assertDatabaseHas('professional_health_insurance', [
            'professional_id' => $candidate->id,
            'health_insurance_id' => $healthInsurance->id,
        ]);
        $this->assertDatabaseMissing('professional_health_insurance', [
            'professional_id' => $assigned->id,
            'health_insurance_id' => $healthInsurance->id,
        ]);
        $this->assertDatabaseHas('professional_health_insurance', [
            'professional_id' => $assigned->id,
            'health_insurance_id' => $other->id,
        ]);

        $this->actingAs($super)
            ->patch('/health-insurances/'.$healthInsurance->id, [
                'name' => 'OSDE',
                'professional_ids' => [],
            ])
            ->assertRedirect('/admin/configuracion/obras-sociales');

        $this->assertDatabaseMissing('professional_health_insurance', ['health_insurance_id' => $healthInsurance->id]);
        $this->assertTrue($candidate->fresh()->healthInsurances()->whereKey($other->id)->doesntExist());
        $this->assertTrue($assigned->fresh()->healthInsurances()->whereKey($other->id)->exists());
    }

    public function test_super_admin_associates_health_insurances_from_professional_profile(): void
    {
        $super = $this->makeSuperAdmin();
        $kept = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $added = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $professional = $this->makeProfessional(['name' => 'Ana Perfil']);
        $professional->healthInsurances()->sync([$kept->id]);

        $this->actingAs($this->makePatient()->user)
            ->get('/paciente/profesionales/'.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Show')
                ->missing('healthInsurances'));

        $this->actingAs($this->makeAdmin())
            ->get('/admin/profesionales/'.$professional->id.'/obras-sociales')
            ->assertRedirect('/admin');

        $this->actingAs($super)
            ->get('/admin/profesionales/'.$professional->id.'/obras-sociales')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/HealthInsurances')
                ->has('healthInsurances', HealthInsurance::query()->count()));

        $this->actingAs($super)
            ->patch('/professionals/'.$professional->id.'/health-insurances', [
                'health_insurance_ids' => [$added->id],
            ])
            ->assertRedirect('/admin/profesionales/'.$professional->id);

        $this->assertEqualsCanonicalizing(
            [$added->id],
            $professional->fresh()->healthInsurances()->pluck('health_insurances.id')->all(),
        );

        $this->actingAs($super)
            ->patch('/professionals/'.$professional->id.'/health-insurances', [
                'health_insurance_ids' => [],
            ])
            ->assertRedirect('/admin/profesionales/'.$professional->id);

        $this->assertTrue($professional->fresh()->healthInsurances()->doesntExist());
    }

    public function test_registration_rejects_a_health_insurance_string(): void
    {
        $this->post('/register', [
            'name' => 'Nora Paciente',
            'email' => 'nora-text@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '40111999',
            'birth_date' => '1995-04-10',
            'health_insurance_id' => 'OSDE',
        ])->assertSessionHasErrors('health_insurance_id');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'nora-text@example.com']);

        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);

        $this->post('/register', [
            'name' => 'Nora Paciente',
            'email' => 'nora-osde@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '40111888',
            'birth_date' => '1995-04-10',
            'health_insurance_id' => '',
        ])->assertRedirect('/paciente');

        $empty = User::query()->where('email', 'nora-osde@example.com')->first();
        $this->assertNotNull($empty);
        $this->assertNull($empty->patient->health_insurance);
        $this->assertDatabaseMissing('patient_health_insurance', ['patient_id' => $empty->patient->id]);

        auth()->logout();

        $this->post('/register', [
            'name' => 'Luis Paciente',
            'email' => 'luis-osde@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '40111777',
            'birth_date' => '1994-04-10',
            'health_insurance_id' => $osde->id,
        ])->assertRedirect('/paciente');

        $linked = User::query()->where('email', 'luis-osde@example.com')->first();
        $this->assertSame('OSDE', $linked?->patient?->health_insurance);
    }

    public function test_super_admin_can_change_an_existing_patients_health_insurance(): void
    {
        $super = $this->makeSuperAdmin();
        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $swiss = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $patient = $this->makePatient(['name' => 'Nora Ya Creada']);
        $patient->healthInsurances()->sync([$osde->id]);

        $this->actingAs($super)
            ->get('/admin/pacientes/'.$patient->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/UserPatient')
                ->where('healthInsuranceId', $osde->id)
                ->has('healthInsurances'));

        $this->actingAs($super)
            ->patch('/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => $swiss->id,
            ])
            ->assertRedirect('/admin/pacientes/'.$patient->id);

        $this->assertSame('Swiss Medical', $patient->fresh()->health_insurance);
        $this->assertEqualsCanonicalizing(
            [$swiss->id],
            $patient->fresh()->healthInsurances()->pluck('health_insurances.id')->all(),
        );

        $this->actingAs($super)
            ->patch('/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => '',
            ])
            ->assertRedirect('/admin/pacientes/'.$patient->id);

        $this->assertNull($patient->fresh()->health_insurance);
        $this->assertDatabaseMissing('patient_health_insurance', ['patient_id' => $patient->id]);

        $this->actingAs($super)
            ->patch('/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => 'OSDE',
            ])
            ->assertSessionHasErrors('health_insurance_id');

        $this->assertDatabaseMissing('patient_health_insurance', ['patient_id' => $patient->id]);
    }
}
