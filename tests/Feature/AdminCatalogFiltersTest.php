<?php

namespace Tests\Feature;

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

    public function test_admin_doctors_list_all_without_filters_and_filter_by_specialty_and_name(): void
    {
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $this->makeDoctor(['name' => 'Ana Pérez'], ['specialty_id' => $specialty->id]);
        $this->makeDoctor(['name' => 'Luis Gómez']);
        $this->makeDoctor(['name' => 'Sin Especialidad'], ['specialty_ids' => []]);

        $this->actingAs($admin)
            ->get('/admin/doctors')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Doctors')
                ->has('doctors', 3)
                ->where('filters.specialty_id', 'all')
                ->where('filters.q', ''))
            ->assertDontSee('Matrícula');

        $this->actingAs($admin)
            ->get('/admin/doctors/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/DoctorCreate')
                ->has('specialties'));

        $this->actingAs($admin)
            ->get('/admin/doctors?specialty_id='.$specialty->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('doctors', 1)->where('doctors.0.user.name', 'Ana Pérez'));

        $this->actingAs($admin)
            ->get('/admin/doctors?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('doctors', 1)->where('doctors.0.user.name', 'Ana Pérez'));

        $this->actingAs($admin)
            ->get('/admin/doctors?specialty_id=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('doctors', 3));
    }

    public function test_super_admin_admins_list_all_without_filters_and_filter_by_name_and_email(): void
    {
        $super = $this->makeSuperAdmin(['name' => 'Sofía Super', 'email' => 'sofia@example.com']);
        $this->makeAdmin(['name' => 'Ana Admin', 'email' => 'ana@example.com']);
        $this->makeAdmin(['name' => 'Luis Admin', 'email' => 'luis@example.com']);
        $this->makeDoctor(['name' => 'Doctor Fuera']);
        $this->makePatient(['name' => 'Paciente Fuera']);

        $this->actingAs($super)
            ->get('/admin/admins')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Admins')
                ->has('users', 3)
                ->where('filters.q', ''));

        $this->actingAs($super)
            ->get('/admin/admins?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('users', 1)
                ->where('users.0.name', 'Ana Admin')
                ->where('filters.q', 'Ana'));

        $this->actingAs($super)
            ->get('/admin/admins?q=luis@')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('users', 1)
                ->where('users.0.email', 'luis@example.com')
                ->where('filters.q', 'luis@'));
    }

    public function test_super_admin_patients_list_all_without_filters_and_filter_by_name_and_email(): void
    {
        $super = $this->makeSuperAdmin(['name' => 'Sofía Super', 'email' => 'sofia@example.com']);
        $this->makeAdmin(['name' => 'Ana Admin', 'email' => 'ana@example.com']);
        $this->makeDoctor(['name' => 'Ana Pérez', 'email' => 'ana.doc@example.com']);
        $this->makePatient(['name' => 'Luis Paciente', 'email' => 'luis@example.com'], ['dni' => '44556677']);
        $this->makePatient(['name' => 'Ana Paciente', 'email' => 'ana.pac@example.com']);

        $this->actingAs($super)
            ->get('/admin/patients')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Patients')
                ->has('patients', 2)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('patients.1.user.name', 'Ana Paciente')
                ->where('filters.q', ''));

        $this->actingAs($super)
            ->get('/admin/patients?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Ana Paciente')
                ->where('filters.q', 'Ana'));

        $this->actingAs($super)
            ->get('/admin/patients?q=luis@')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('patients.0.user.email', 'luis@example.com')
                ->where('filters.q', 'luis@'));

        $this->actingAs($super)
            ->get('/admin/patients?q=44556')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.user.name', 'Luis Paciente')
                ->where('filters.q', '44556'));
    }
}
