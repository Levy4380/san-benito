<?php

namespace Tests\Feature;

use App\Models\HealthInsurance;
use App\Models\Specialty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AdminCatalogFiltersTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_admin_professionals_list_all_without_filters_and_filter_by_specialty_and_name(): void
    {
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $this->makeProfessional(['name' => 'Ana Pérez'], ['specialty_id' => $specialty->id]);
        $this->makeProfessional(['name' => 'Luis Gómez']);
        $this->makeProfessional(['name' => 'Sin Especialidad'], ['specialty_ids' => []]);

        $this->actingAs($admin)
            ->get('/admin/profesionales')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Professionals')
                ->has('professionals', 3)
                ->where('professionals.0.health_insurances', [])
                ->where('filters.specialty_id', 'all')
                ->where('filters.q', ''))
            ->assertDontSee('Matrícula');

        $this->actingAs($admin)
            ->getJson('/professionals/create')
            ->assertOk()
            ->assertJsonStructure(['specialties', 'healthInsurances']);

        $this->actingAs($admin)
            ->get('/admin/profesionales?specialty_id='.$specialty->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 1)->where('professionals.0.user.name', 'Ana Pérez'));

        $this->actingAs($admin)
            ->get('/admin/profesionales?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 1)->where('professionals.0.user.name', 'Ana Pérez'));

        $this->actingAs($admin)
            ->get('/admin/profesionales?specialty_id=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 3));
    }

    public function test_super_admin_admins_list_all_without_filters_and_filter_by_name_and_email(): void
    {
        $super = $this->makeSuperAdmin(['name' => 'Sofía Super', 'email' => 'sofia@example.com']);
        $this->makeAdmin(['name' => 'Ana Admin', 'email' => 'ana@example.com']);
        $this->makeAdmin(['name' => 'Luis Admin', 'email' => 'luis@example.com']);
        $this->makeProfessional(['name' => 'Professional Fuera']);
        $this->makePatient(['name' => 'Paciente Fuera']);

        $this->actingAs($super)
            ->get('/admin/administradores')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Admins')
                ->has('users', 3)
                ->where('filters.q', ''));

        $this->actingAs($super)
            ->get('/admin/administradores?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('users', 1)
                ->where('users.0.name', 'Ana Admin')
                ->where('filters.q', 'Ana'));

        $this->actingAs($super)
            ->get('/admin/administradores?q=luis@')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('users', 1)
                ->where('users.0.email', 'luis@example.com')
                ->where('filters.q', 'luis@'));
    }

    public function test_super_admin_patients_list_all_without_filters_and_filter_by_name_and_email(): void
    {
        $super = $this->makeSuperAdmin(['name' => 'Sofía Super', 'email' => 'sofia@example.com']);
        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $swiss = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $this->makeAdmin(['name' => 'Ana Admin', 'email' => 'ana@example.com']);
        $this->makeProfessional(['name' => 'Ana Pérez', 'email' => 'ana.doc@example.com']);
        $luis = $this->makePatient(['name' => 'Luis Paciente', 'email' => 'luis@example.com'], ['dni' => '44556677']);
        $ana = $this->makePatient(['name' => 'Ana Paciente', 'email' => 'ana.pac@example.com']);
        $luis->healthInsurances()->attach($osde);
        $ana->healthInsurances()->attach($swiss);

        $this->actingAs($super)
            ->get('/admin/pacientes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Patients')
                ->has('patients', 2)
                ->has('healthInsurances', 2)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('patients.1.user.name', 'Ana Paciente')
                ->where('filters.q', '')
                ->where('filters.health_insurance_id', 'all'));

        $this->actingAs($super)
            ->get('/admin/pacientes?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Ana Paciente')
                ->where('filters.q', 'Ana'));

        $this->actingAs($super)
            ->get('/admin/pacientes?q=luis@')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('patients.0.user.email', 'luis@example.com')
                ->where('filters.q', 'luis@'));

        $this->actingAs($super)
            ->get('/admin/pacientes?q=44556')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('filters.q', '44556'));

        $this->actingAs($super)
            ->get('/admin/pacientes?health_insurance_id='.$osde->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('filters.health_insurance_id', (string) $osde->id));

        $this->actingAs($super)
            ->get('/admin/pacientes?health_insurance_id=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('patients', 2));
    }
}
