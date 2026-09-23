<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HealthInsurance;
use App\Models\Specialty;
use App\Models\User;
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
        $this->assertTrue(Schema::hasTable('doctor_health_insurance'));
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

    public function test_patient_doctor_and_admin_cannot_manage_health_insurances(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();
        $healthInsurance = HealthInsurance::factory()->create(['name' => 'OSDE']);

        foreach ([$patient->user, $doctor->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/settings/health-insurances')->assertRedirect('/');
            $this->actingAs($user)->get('/admin/settings/health-insurances/create')->assertRedirect('/');
            $this->actingAs($user)->get('/admin/settings/health-insurances/'.$healthInsurance->id.'/edit')->assertRedirect('/');
            $this->actingAs($user)->post('/admin/settings/health-insurances', ['name' => 'Galeno'])->assertRedirect('/');
            $this->actingAs($user)->patch('/admin/settings/health-insurances/'.$healthInsurance->id, ['name' => 'Renombrada'])->assertRedirect('/');
            $this->actingAs($user)->delete('/admin/settings/health-insurances/'.$healthInsurance->id)->assertRedirect('/');
            $this->actingAs($user)->get('/doctors/'.$doctor->id.'/health-insurances')->assertRedirect('/');
            $this->actingAs($user)->patch('/admin/doctors/'.$doctor->id.'/health-insurances', [
                'health_insurance_ids' => [$healthInsurance->id],
            ])->assertRedirect('/');
            $this->actingAs($user)->patch('/admin/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => $healthInsurance->id,
            ])->assertRedirect('/');
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
            ->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Settings'));

        $this->actingAs($super)
            ->get('/admin/settings/health-insurances')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/HealthInsurances')
                ->has('healthInsurances'));

        $this->actingAs($super)
            ->get('/admin/settings/health-insurances/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/HealthInsuranceCreate'));

        $this->actingAs($super)
            ->post('/admin/settings/health-insurances', ['name' => '  Galeno  '])
            ->assertRedirect('/admin/settings/health-insurances');

        $this->assertDatabaseHas('health_insurances', ['name' => 'Galeno']);

        $created = HealthInsurance::query()->where('name', 'Galeno')->firstOrFail();

        $this->actingAs($this->makeAdmin())
            ->post('/admin/doctors', [
                'name' => 'Carla Ruiz',
                'email' => 'carla@example.com',
                'password' => 'password',
                'license_number' => 'MN-88888',
                'specialty_ids' => [Specialty::query()->firstOrFail()->id],
                'health_insurance_ids' => [$created->id],
            ])
            ->assertRedirect();

        $doctor = User::query()->where('email', 'carla@example.com')->first()?->doctor;
        $this->assertNotNull($doctor);
        $this->assertDatabaseHas('doctor_health_insurance', [
            'doctor_id' => $doctor->id,
            'health_insurance_id' => $created->id,
        ]);

        $this->actingAs($this->makeAdmin())
            ->post('/admin/doctors', [
                'name' => 'Sin Obra',
                'email' => 'sinobra@example.com',
                'password' => 'password',
                'license_number' => 'MN-88889',
                'specialty_ids' => [Specialty::query()->firstOrFail()->id],
                'health_insurance_ids' => [],
            ])
            ->assertRedirect();

        $without = User::query()->where('email', 'sinobra@example.com')->first()?->doctor;
        $this->assertNotNull($without);
        $this->assertTrue($without->healthInsurances()->doesntExist());

        $this->actingAs($super)
            ->post('/admin/settings/health-insurances', ['name' => 'Galeno'])
            ->assertSessionHasErrors('name');

        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);

        $this->actingAs($super)
            ->get('/admin/settings/health-insurances/'.$osde->id.'/edit')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/HealthInsuranceEdit')
                ->where('healthInsurance.id', $osde->id)
                ->where('healthInsurance.name', 'OSDE')
                ->has('doctors'));

        $this->actingAs($super)
            ->patch('/admin/settings/health-insurances/'.$osde->id, ['name' => 'OSDE 210'])
            ->assertRedirect('/admin/settings/health-insurances');

        $this->assertDatabaseHas('health_insurances', [
            'id' => $osde->id,
            'name' => 'OSDE 210',
        ]);

        $this->actingAs($super)
            ->patch('/admin/settings/health-insurances/'.$osde->id, ['name' => 'Galeno'])
            ->assertSessionHasErrors('name');

        $unused = HealthInsurance::factory()->create(['name' => 'Temporal']);

        $this->actingAs($super)
            ->delete('/admin/settings/health-insurances/'.$unused->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('health_insurances', ['id' => $unused->id]);
    }

    public function test_super_admin_deletes_insurance_and_detaches_without_touching_appointments(): void
    {
        $super = $this->makeSuperAdmin();
        $removed = HealthInsurance::factory()->create(['name' => 'En uso']);
        $kept = HealthInsurance::factory()->create(['name' => 'Se queda']);
        $specialty = Specialty::factory()->create(['name' => 'Clínica extra']);
        $doctor = $this->makeDoctor(['name' => 'Ana Vinculada'], ['specialty_id' => $specialty->id]);
        $patient = $this->makePatient(['name' => 'Nora Vinculada']);
        $doctor->healthInsurances()->sync([$removed->id, $kept->id]);
        $patient->healthInsurances()->sync([$removed->id]);
        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'specialty_id' => $specialty->id,
        ]);

        $this->actingAs($super)
            ->delete('/admin/settings/health-insurances/'.$removed->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('health_insurances', ['id' => $removed->id]);
        $this->assertDatabaseMissing('doctor_health_insurance', ['health_insurance_id' => $removed->id]);
        $this->assertDatabaseMissing('patient_health_insurance', ['health_insurance_id' => $removed->id]);
        $this->assertDatabaseHas('doctor_health_insurance', [
            'doctor_id' => $doctor->id,
            'health_insurance_id' => $kept->id,
        ]);
        $this->assertNotNull($doctor->fresh());
        $this->assertNotNull($patient->fresh());
        $this->assertNotNull($doctor->user()->first());
        $this->assertNotNull($patient->user()->first());
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_super_admin_syncs_associated_doctors_and_can_leave_zero(): void
    {
        $super = $this->makeSuperAdmin();
        $healthInsurance = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $other = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $assigned = $this->makeDoctor(['name' => 'Ana Asignada']);
        $candidate = $this->makeDoctor(['name' => 'Luis Candidato']);
        $assigned->healthInsurances()->sync([$healthInsurance->id, $other->id]);

        $this->actingAs($super)
            ->patch('/admin/settings/health-insurances/'.$healthInsurance->id, [
                'name' => 'OSDE',
                'doctor_ids' => [$candidate->id],
            ])
            ->assertRedirect('/admin/settings/health-insurances');

        $this->assertDatabaseHas('doctor_health_insurance', [
            'doctor_id' => $candidate->id,
            'health_insurance_id' => $healthInsurance->id,
        ]);
        $this->assertDatabaseMissing('doctor_health_insurance', [
            'doctor_id' => $assigned->id,
            'health_insurance_id' => $healthInsurance->id,
        ]);
        $this->assertDatabaseHas('doctor_health_insurance', [
            'doctor_id' => $assigned->id,
            'health_insurance_id' => $other->id,
        ]);

        $this->actingAs($super)
            ->patch('/admin/settings/health-insurances/'.$healthInsurance->id, [
                'name' => 'OSDE',
                'doctor_ids' => [],
            ])
            ->assertRedirect('/admin/settings/health-insurances');

        $this->assertDatabaseMissing('doctor_health_insurance', ['health_insurance_id' => $healthInsurance->id]);
        $this->assertTrue($candidate->fresh()->healthInsurances()->whereKey($other->id)->doesntExist());
        $this->assertTrue($assigned->fresh()->healthInsurances()->whereKey($other->id)->exists());
    }

    public function test_super_admin_associates_health_insurances_from_doctor_profile(): void
    {
        $super = $this->makeSuperAdmin();
        $kept = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $added = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $doctor = $this->makeDoctor(['name' => 'Ana Perfil']);
        $doctor->healthInsurances()->sync([$kept->id]);

        $this->actingAs($this->makePatient()->user)
            ->get('/doctors/'.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Show')
                ->missing('healthInsurances'));

        $this->actingAs($this->makeAdmin())
            ->get('/doctors/'.$doctor->id.'/health-insurances')
            ->assertRedirect('/');

        $this->actingAs($super)
            ->get('/doctors/'.$doctor->id.'/health-insurances')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/HealthInsurances')
                ->has('healthInsurances', HealthInsurance::query()->count()));

        $this->actingAs($super)
            ->patch('/admin/doctors/'.$doctor->id.'/health-insurances', [
                'health_insurance_ids' => [$added->id],
            ])
            ->assertRedirect('/doctors/'.$doctor->id);

        $this->assertEqualsCanonicalizing(
            [$added->id],
            $doctor->fresh()->healthInsurances()->pluck('health_insurances.id')->all(),
        );

        $this->actingAs($super)
            ->patch('/admin/doctors/'.$doctor->id.'/health-insurances', [
                'health_insurance_ids' => [],
            ])
            ->assertRedirect('/doctors/'.$doctor->id);

        $this->assertTrue($doctor->fresh()->healthInsurances()->doesntExist());
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
        ])->assertRedirect('/');

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
        ])->assertRedirect('/');

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
            ->get('/admin/patients/'.$patient->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/UserPatient')
                ->where('healthInsuranceId', $osde->id)
                ->has('healthInsurances'));

        $this->actingAs($super)
            ->patch('/admin/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => $swiss->id,
            ])
            ->assertRedirect('/admin/patients/'.$patient->id);

        $this->assertSame('Swiss Medical', $patient->fresh()->health_insurance);
        $this->assertEqualsCanonicalizing(
            [$swiss->id],
            $patient->fresh()->healthInsurances()->pluck('health_insurances.id')->all(),
        );

        $this->actingAs($super)
            ->patch('/admin/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => '',
            ])
            ->assertRedirect('/admin/patients/'.$patient->id);

        $this->assertNull($patient->fresh()->health_insurance);
        $this->assertDatabaseMissing('patient_health_insurance', ['patient_id' => $patient->id]);

        $this->actingAs($super)
            ->patch('/admin/patients/'.$patient->id.'/health-insurance', [
                'health_insurance_id' => 'OSDE',
            ])
            ->assertSessionHasErrors('health_insurance_id');

        $this->assertDatabaseMissing('patient_health_insurance', ['patient_id' => $patient->id]);
    }
}
