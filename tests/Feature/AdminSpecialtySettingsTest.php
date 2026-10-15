<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Specialty;
use App\Models\User;
use App\Support\RoleRedirector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AdminSpecialtySettingsTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_24_patient_professional_and_admin_cannot_manage_specialties(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->firstOrFail();

        foreach ([$patient->user, $professional->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/configuracion')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/especialidades')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/especialidades/crear')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/especialidades/'.$specialty->id.'/editar')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->post('/specialties', ['name' => 'Oftalmología'])->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->patch('/specialties/'.$specialty->id, ['name' => 'Renombrada'])->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->delete('/specialties/'.$specialty->id)->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/profesionales/'.$professional->id.'/especialidades')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->patch('/professionals/'.$professional->id.'/specialties', [
                'specialty_ids' => [$specialty->id],
            ])->assertRedirect(RoleRedirector::landing($user));
        }

        $this->assertDatabaseHas('specialties', [
            'id' => $specialty->id,
            'name' => $specialty->name,
        ]);
    }

    public function test_24_super_admin_creates_renames_and_deletes_unused_specialties(): void
    {
        $super = $this->makeSuperAdmin();

        $this->actingAs($super)
            ->get('/admin/configuracion')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Settings')
                ->missing('specialties'));

        $this->actingAs($super)
            ->get('/admin/configuracion/especialidades')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Specialties')
                ->has('specialties'));

        $this->actingAs($super)
            ->getJson('/admin/configuracion/especialidades/crear')
            ->assertOk()
            ->assertExactJson([]);

        $this->actingAs($super)
            ->post('/specialties', ['name' => '  Oftalmología  '])
            ->assertRedirect('/admin/configuracion/especialidades');

        $this->assertDatabaseHas('specialties', ['name' => 'Oftalmología']);

        $created = Specialty::query()->where('name', 'Oftalmología')->firstOrFail();

        $this->actingAs($this->makeAdmin())
            ->post('/professionals', [
                'name' => 'Carla Ruiz',
                'email' => 'carla@example.com',
                'password' => 'password',
                'license_number' => 'MN-88888',
                'specialty_ids' => [$created->id],
            ])
            ->assertRedirect();

        $this->assertNotNull(User::query()->where('email', 'carla@example.com')->first()?->professional);

        $this->actingAs($super)
            ->post('/specialties', ['name' => 'Oftalmología'])
            ->assertSessionHasErrors('name');

        $neurologia = Specialty::factory()->create(['name' => 'Neurología']);

        $this->actingAs($super)
            ->get('/admin/configuracion/especialidades/'.$neurologia->id.'/editar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SpecialtyEdit')
                ->where('specialty.id', $neurologia->id)
                ->where('specialty.name', 'Neurología')
                ->has('professionals'));

        $this->actingAs($super)
            ->patch('/specialties/'.$neurologia->id, ['name' => 'Neurología clínica'])
            ->assertRedirect('/admin/configuracion/especialidades');

        $this->assertDatabaseHas('specialties', [
            'id' => $neurologia->id,
            'name' => 'Neurología clínica',
        ]);

        $this->actingAs($super)
            ->patch('/specialties/'.$neurologia->id, ['name' => 'Oftalmología'])
            ->assertSessionHasErrors('name');

        $this->actingAs($super)
            ->patch('/specialties/'.$neurologia->id, ['name' => 'Neurología clínica'])
            ->assertRedirect('/admin/configuracion/especialidades');

        $unused = Specialty::factory()->create(['name' => 'Temporal']);

        $this->actingAs($super)
            ->delete('/specialties/'.$unused->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('specialties', ['id' => $unused->id]);
    }

    public function test_24_super_admin_deletes_specialty_and_detaches_professionals(): void
    {
        $super = $this->makeSuperAdmin();
        $kept = Specialty::factory()->create(['name' => 'Se queda']);
        $removed = Specialty::factory()->create(['name' => 'En uso']);
        $onlyThat = $this->makeProfessional(['name' => 'Solo esa'], ['specialty_id' => $removed->id]);
        $alsoOther = $this->makeProfessional(['name' => 'También otra'], ['specialty_ids' => [$removed->id, $kept->id]]);

        $this->actingAs($super)
            ->delete('/specialties/'.$removed->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('specialties', ['id' => $removed->id]);
        $this->assertDatabaseMissing('professional_specialty', ['specialty_id' => $removed->id]);
        $this->assertTrue($onlyThat->fresh()->specialties()->doesntExist());
        $this->assertEqualsCanonicalizing(
            [$kept->id],
            $alsoOther->fresh()->specialties()->pluck('specialties.id')->all(),
        );
        $this->assertNotNull($onlyThat->fresh());
        $this->assertNotNull($alsoOther->fresh());
    }

    public function test_24_super_admin_syncs_associated_professionals_and_can_leave_zero(): void
    {
        $super = $this->makeSuperAdmin();
        $specialty = Specialty::factory()->create(['name' => 'Dermatología clínica']);
        $other = Specialty::factory()->create(['name' => 'Otra']);
        $assigned = $this->makeProfessional(['name' => 'Ana Asignada'], ['specialty_ids' => [$specialty->id, $other->id]]);
        $candidate = $this->makeProfessional(['name' => 'Luis Candidato'], ['specialty_id' => $other->id]);

        $this->actingAs($super)
            ->patch('/specialties/'.$specialty->id, [
                'name' => 'Dermatología clínica',
                'professional_ids' => [$candidate->id],
            ])
            ->assertRedirect('/admin/configuracion/especialidades');

        $this->assertDatabaseHas('professional_specialty', [
            'professional_id' => $candidate->id,
            'specialty_id' => $specialty->id,
        ]);
        $this->assertDatabaseMissing('professional_specialty', [
            'professional_id' => $assigned->id,
            'specialty_id' => $specialty->id,
        ]);
        $this->assertDatabaseHas('professional_specialty', [
            'professional_id' => $assigned->id,
            'specialty_id' => $other->id,
        ]);

        $this->actingAs($super)
            ->patch('/specialties/'.$specialty->id, [
                'name' => 'Dermatología clínica',
                'professional_ids' => [],
            ])
            ->assertRedirect('/admin/configuracion/especialidades');

        $this->assertDatabaseMissing('professional_specialty', ['specialty_id' => $specialty->id]);
        $this->assertTrue($candidate->fresh()->specialties()->whereKey($other->id)->exists());
    }

    public function test_24_super_admin_associates_specialties_from_professional_profile(): void
    {
        $super = $this->makeSuperAdmin();
        $kept = Specialty::factory()->create(['name' => 'Clínica extra']);
        $added = Specialty::factory()->create(['name' => 'Nueva asociación']);
        $professional = $this->makeProfessional(['name' => 'Ana Perfil'], ['specialty_id' => $kept->id]);

        $this->actingAs($this->makePatient()->user)
            ->get('/paciente/profesionales/'.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Show')
                ->missing('specialties'));

        $this->actingAs($this->makeAdmin())
            ->get('/admin/profesionales/'.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Show')
                ->missing('specialties'));

        $this->actingAs($this->makeAdmin())
            ->get('/admin/profesionales/'.$professional->id.'/especialidades')
            ->assertRedirect('/admin');

        $this->actingAs($super)
            ->get('/paciente/profesionales/'.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Show')
                ->missing('specialties'));

        $this->actingAs($super)
            ->get('/admin/profesionales/'.$professional->id.'/especialidades')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Specialties')
                ->has('specialties', Specialty::query()->count()));

        $this->actingAs($super)
            ->patch('/professionals/'.$professional->id.'/specialties', [
                'specialty_ids' => [$added->id],
            ])
            ->assertRedirect('/admin/profesionales/'.$professional->id);

        $this->assertEqualsCanonicalizing(
            [$added->id],
            $professional->fresh()->specialties()->pluck('specialties.id')->all(),
        );

        $this->actingAs($super)
            ->patch('/professionals/'.$professional->id.'/specialties', [
                'specialty_ids' => [],
            ])
            ->assertRedirect('/admin/profesionales/'.$professional->id);

        $this->assertTrue($professional->fresh()->specialties()->doesntExist());
    }

    public function test_24_cannot_delete_specialty_with_appointments(): void
    {
        $super = $this->makeSuperAdmin();
        $specialty = Specialty::factory()->create(['name' => 'Con turnos']);
        $professional = $this->makeProfessional(['name' => 'Ana Con turno'], ['specialty_id' => $specialty->id]);
        $patient = $this->makePatient();
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'specialty_id' => $specialty->id,
            'starts_at' => now()->subDay()->setTime(10, 0, 0),
            'ends_at' => now()->subDay()->setTime(10, 20, 0),
        ]);

        $this->actingAs($super)
            ->delete('/specialties/'.$specialty->id)
            ->assertSessionHasErrors('specialty');

        $this->assertDatabaseHas('specialties', ['id' => $specialty->id, 'name' => 'Con turnos']);
        $this->assertDatabaseHas('appointments', ['specialty_id' => $specialty->id]);
        $this->assertDatabaseHas('professional_specialty', [
            'professional_id' => $professional->id,
            'specialty_id' => $specialty->id,
        ]);
    }
}
