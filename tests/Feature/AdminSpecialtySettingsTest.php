<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Specialty;
use App\Models\User;
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

    public function test_24_patient_doctor_and_admin_cannot_manage_specialties(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->firstOrFail();

        foreach ([$patient->user, $doctor->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/settings')->assertRedirect('/');
            $this->actingAs($user)->get('/admin/settings/specialties')->assertRedirect('/');
            $this->actingAs($user)->get('/admin/settings/specialties/create')->assertRedirect('/');
            $this->actingAs($user)->get('/admin/settings/specialties/'.$specialty->id.'/edit')->assertRedirect('/');
            $this->actingAs($user)->post('/admin/settings/specialties', ['name' => 'Oftalmología'])->assertRedirect('/');
            $this->actingAs($user)->patch('/admin/settings/specialties/'.$specialty->id, ['name' => 'Renombrada'])->assertRedirect('/');
            $this->actingAs($user)->delete('/admin/settings/specialties/'.$specialty->id)->assertRedirect('/');
            $this->actingAs($user)->get('/doctors/'.$doctor->id.'/specialties')->assertRedirect('/');
            $this->actingAs($user)->patch('/admin/doctors/'.$doctor->id.'/specialties', [
                'specialty_ids' => [$specialty->id],
            ])->assertRedirect('/');
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
            ->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Settings')
                ->missing('specialties'));

        $this->actingAs($super)
            ->get('/admin/settings/specialties')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Specialties')
                ->has('specialties'));

        $this->actingAs($super)
            ->get('/admin/settings/specialties/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/SpecialtyCreate'));

        $this->actingAs($super)
            ->post('/admin/settings/specialties', ['name' => '  Oftalmología  '])
            ->assertRedirect('/admin/settings/specialties');

        $this->assertDatabaseHas('specialties', ['name' => 'Oftalmología']);

        $created = Specialty::query()->where('name', 'Oftalmología')->firstOrFail();

        $this->actingAs($this->makeAdmin())
            ->post('/admin/doctors', [
                'name' => 'Carla Ruiz',
                'email' => 'carla@example.com',
                'password' => 'password',
                'license_number' => 'MN-88888',
                'specialty_ids' => [$created->id],
            ])
            ->assertRedirect();

        $this->assertNotNull(User::query()->where('email', 'carla@example.com')->first()?->doctor);

        $this->actingAs($super)
            ->post('/admin/settings/specialties', ['name' => 'Oftalmología'])
            ->assertSessionHasErrors('name');

        $neurologia = Specialty::factory()->create(['name' => 'Neurología']);

        $this->actingAs($super)
            ->get('/admin/settings/specialties/'.$neurologia->id.'/edit')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SpecialtyEdit')
                ->where('specialty.id', $neurologia->id)
                ->where('specialty.name', 'Neurología')
                ->has('doctors'));

        $this->actingAs($super)
            ->patch('/admin/settings/specialties/'.$neurologia->id, ['name' => 'Neurología clínica'])
            ->assertRedirect('/admin/settings/specialties');

        $this->assertDatabaseHas('specialties', [
            'id' => $neurologia->id,
            'name' => 'Neurología clínica',
        ]);

        $this->actingAs($super)
            ->patch('/admin/settings/specialties/'.$neurologia->id, ['name' => 'Oftalmología'])
            ->assertSessionHasErrors('name');

        $this->actingAs($super)
            ->patch('/admin/settings/specialties/'.$neurologia->id, ['name' => 'Neurología clínica'])
            ->assertRedirect('/admin/settings/specialties');

        $unused = Specialty::factory()->create(['name' => 'Temporal']);

        $this->actingAs($super)
            ->delete('/admin/settings/specialties/'.$unused->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('specialties', ['id' => $unused->id]);
    }

    public function test_24_super_admin_deletes_specialty_and_detaches_doctors(): void
    {
        $super = $this->makeSuperAdmin();
        $kept = Specialty::factory()->create(['name' => 'Se queda']);
        $removed = Specialty::factory()->create(['name' => 'En uso']);
        $onlyThat = $this->makeDoctor(['name' => 'Solo esa'], ['specialty_id' => $removed->id]);
        $alsoOther = $this->makeDoctor(['name' => 'También otra'], ['specialty_ids' => [$removed->id, $kept->id]]);

        $this->actingAs($super)
            ->delete('/admin/settings/specialties/'.$removed->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('specialties', ['id' => $removed->id]);
        $this->assertDatabaseMissing('doctor_specialty', ['specialty_id' => $removed->id]);
        $this->assertTrue($onlyThat->fresh()->specialties()->doesntExist());
        $this->assertEqualsCanonicalizing(
            [$kept->id],
            $alsoOther->fresh()->specialties()->pluck('specialties.id')->all(),
        );
        $this->assertNotNull($onlyThat->fresh());
        $this->assertNotNull($alsoOther->fresh());
    }

    public function test_24_super_admin_syncs_associated_doctors_and_can_leave_zero(): void
    {
        $super = $this->makeSuperAdmin();
        $specialty = Specialty::factory()->create(['name' => 'Dermatología clínica']);
        $other = Specialty::factory()->create(['name' => 'Otra']);
        $assigned = $this->makeDoctor(['name' => 'Ana Asignada'], ['specialty_ids' => [$specialty->id, $other->id]]);
        $candidate = $this->makeDoctor(['name' => 'Luis Candidato'], ['specialty_id' => $other->id]);

        $this->actingAs($super)
            ->patch('/admin/settings/specialties/'.$specialty->id, [
                'name' => 'Dermatología clínica',
                'doctor_ids' => [$candidate->id],
            ])
            ->assertRedirect('/admin/settings/specialties');

        $this->assertDatabaseHas('doctor_specialty', [
            'doctor_id' => $candidate->id,
            'specialty_id' => $specialty->id,
        ]);
        $this->assertDatabaseMissing('doctor_specialty', [
            'doctor_id' => $assigned->id,
            'specialty_id' => $specialty->id,
        ]);
        $this->assertDatabaseHas('doctor_specialty', [
            'doctor_id' => $assigned->id,
            'specialty_id' => $other->id,
        ]);

        $this->actingAs($super)
            ->patch('/admin/settings/specialties/'.$specialty->id, [
                'name' => 'Dermatología clínica',
                'doctor_ids' => [],
            ])
            ->assertRedirect('/admin/settings/specialties');

        $this->assertDatabaseMissing('doctor_specialty', ['specialty_id' => $specialty->id]);
        $this->assertTrue($candidate->fresh()->specialties()->whereKey($other->id)->exists());
    }

    public function test_24_super_admin_associates_specialties_from_doctor_profile(): void
    {
        $super = $this->makeSuperAdmin();
        $kept = Specialty::factory()->create(['name' => 'Clínica extra']);
        $added = Specialty::factory()->create(['name' => 'Nueva asociación']);
        $doctor = $this->makeDoctor(['name' => 'Ana Perfil'], ['specialty_id' => $kept->id]);

        $this->actingAs($this->makePatient()->user)
            ->get('/doctors/'.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Show')
                ->missing('specialties'));

        $this->actingAs($this->makeAdmin())
            ->get('/doctors/'.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Show')
                ->missing('specialties'));

        $this->actingAs($this->makeAdmin())
            ->get('/doctors/'.$doctor->id.'/specialties')
            ->assertRedirect('/');

        $this->actingAs($super)
            ->get('/doctors/'.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Show')
                ->missing('specialties'));

        $this->actingAs($super)
            ->get('/doctors/'.$doctor->id.'/specialties')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Specialties')
                ->has('specialties', Specialty::query()->count()));

        $this->actingAs($super)
            ->patch('/admin/doctors/'.$doctor->id.'/specialties', [
                'specialty_ids' => [$added->id],
            ])
            ->assertRedirect('/doctors/'.$doctor->id);

        $this->assertEqualsCanonicalizing(
            [$added->id],
            $doctor->fresh()->specialties()->pluck('specialties.id')->all(),
        );

        $this->actingAs($super)
            ->patch('/admin/doctors/'.$doctor->id.'/specialties', [
                'specialty_ids' => [],
            ])
            ->assertRedirect('/doctors/'.$doctor->id);

        $this->assertTrue($doctor->fresh()->specialties()->doesntExist());
    }

    public function test_24_cannot_delete_specialty_with_appointments(): void
    {
        $super = $this->makeSuperAdmin();
        $specialty = Specialty::factory()->create(['name' => 'Con turnos']);
        $doctor = $this->makeDoctor(['name' => 'Ana Con turno'], ['specialty_id' => $specialty->id]);
        $patient = $this->makePatient();
        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'specialty_id' => $specialty->id,
            'starts_at' => now()->subDay()->setTime(10, 0, 0),
            'ends_at' => now()->subDay()->setTime(10, 20, 0),
        ]);

        $this->actingAs($super)
            ->delete('/admin/settings/specialties/'.$specialty->id)
            ->assertSessionHasErrors('specialty');

        $this->assertDatabaseHas('specialties', ['id' => $specialty->id, 'name' => 'Con turnos']);
        $this->assertDatabaseHas('appointments', ['specialty_id' => $specialty->id]);
        $this->assertDatabaseHas('doctor_specialty', [
            'doctor_id' => $doctor->id,
            'specialty_id' => $specialty->id,
        ]);
    }
}
