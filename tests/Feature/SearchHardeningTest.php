<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Surgery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class SearchHardeningTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_named_routes_and_paths_match_search_contract(): void
    {
        $this->assertSame('/admin/buscar/turnos', route('admin.search.appointments', absolute: false));
        $this->assertSame('/admin/buscar/cirugias', route('admin.search.surgeries', absolute: false));
        $this->assertSame('/profesional/buscar/mis-turnos', route('professional.search.my-appointments', absolute: false));
        $this->assertSame('/profesional/buscar/mis-cirugias', route('professional.search.my-surgeries', absolute: false));
        $this->assertSame('/admin/reservas', route('admin.appointments.index', absolute: false));

        $routes = File::get(base_path('routes/web.php'));
        $this->assertDoesNotMatchRegularExpression(
            "#Route::get\\('/buscar/cirugias'#",
            $this->professionalRoutesSlice($routes),
        );
        $this->assertStringContainsString("Route::get('/buscar/mis-turnos'", $routes);
        $this->assertStringContainsString("Route::get('/buscar/mis-cirugias'", $routes);
    }

    public function test_old_historial_urls_redirect_to_search_preserving_query(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();

        $this->actingAs($admin)
            ->get('/admin/historial/turnos?by=date&date=2026-01-10')
            ->assertRedirect(route('admin.search.appointments', ['by' => 'date', 'date' => '2026-01-10']));
        $this->actingAs($admin)
            ->get('/admin/historial/cirugias?by=patient&q=abc')
            ->assertRedirect(route('admin.search.surgeries', ['by' => 'patient', 'q' => 'abc']));
        $this->actingAs($professional->user)
            ->get('/profesional/historial/mis-turnos')
            ->assertRedirect(route('professional.search.my-appointments'));
        $this->actingAs($professional->user)
            ->get('/profesional/historial/mis-cirugias?by=date&date=2026-01-10')
            ->assertRedirect(route('professional.search.my-surgeries', ['by' => 'date', 'date' => '2026-01-10']));
    }

    public function test_admin_reservas_is_redirect_only_not_inertia_list(): void
    {
        $routes = File::get(base_path('routes/web.php'));
        $this->assertMatchesRegularExpression(
            "#Route::get\\('/reservas',\\s*fn\\s*\\(\\)\\s*=>\\s*redirect\\(\\)->route\\('admin\\.search\\.appointments'\\)\\)#",
            $routes,
        );
        $this->assertStringNotContainsString(
            "Route::get('/reservas', [AdminAppointmentController::class, 'index'])",
            $routes,
        );

        $admin = $this->makeAdmin();
        $this->actingAs($admin)
            ->get('/admin/reservas')
            ->assertRedirect(route('admin.search.appointments'));
    }

    public function test_admin_home_lands_on_surgery_calendar(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->get('/admin')
            ->assertRedirect(route('admin.surgeries.calendar'));

        $this->actingAs($admin)
            ->get('/admin/cirugias/calendario')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/SurgeryCalendar'));
    }

    public function test_admin_search_turnos_lists_past_and_future_appointments(): void
    {
        $admin = $this->makeAdmin();
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $past = now()->subDay()->setTime(10, 0, 0);
        $future = now()->addWeek()->setTime(10, 0, 0);

        $pastAppointment = Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => $past,
            'ends_at' => $past->copy()->addMinutes(20),
        ]);
        $futureAppointment = Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => $future,
            'ends_at' => $future->copy()->addMinutes(20),
        ]);

        $this->actingAs($admin)
            ->get('/admin/buscar/turnos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Appointments')
                ->where('by', null)
                ->has('appointments.data', 0));

        $this->actingAs($admin)
            ->get('/admin/buscar/turnos?by=date&date='.$past->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('by', 'date')
                ->has('appointments.data', 1)
                ->where('appointments.data.0.id', $pastAppointment->id));

        $this->actingAs($admin)
            ->get('/admin/buscar/turnos?by=professional&professional_id='.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('appointments.data', 2)
                ->where('appointments.data.0.id', $futureAppointment->id)
                ->where('appointments.data.0.status', 'scheduled')
                ->where('appointments.data.1.id', $pastAppointment->id));
    }

    public function test_admin_and_portal_section_history_redirects_preserve_query(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=history&q=abc')
            ->assertRedirect(route('admin.search.surgeries', ['q' => 'abc']));

        $this->actingAs($professional->user)
            ->get('/profesional/cirugias?section=history&q=xyz')
            ->assertRedirect(route('professional.search.my-surgeries', ['q' => 'xyz']));
    }

    public function test_admin_search_cirugias_renders_search_section(): void
    {
        $admin = $this->makeAdmin();
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();

        Surgery::factory()->scheduled(Carbon::parse('2020-01-10 09:00:00'))->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'requested_by_user_id' => $admin->id,
            'note' => 'Historial hardening.',
        ]);

        $this->actingAs($admin)
            ->get('/admin/buscar/cirugias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Surgeries')
                ->where('section', 'search')
                ->where('by', null)
                ->has('surgeries.data', 0));

        $this->actingAs($admin)
            ->get('/admin/buscar/cirugias?by=date&date=2020-01-10')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('section', 'search')
                ->where('by', 'date')
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.note', 'Historial hardening.'));
    }

    public function test_professional_search_scopes_and_forbids_wrong_roles(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();
        $admin = $this->makeAdmin();
        $past = now()->subDay()->setTime(11, 0, 0);

        $ownPast = Appointment::factory()->create([
            'professional_id' => $mine->id,
            'patient_id' => $patient->id,
            'starts_at' => $past,
            'ends_at' => $past->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'professional_id' => $other->id,
            'patient_id' => $patient->id,
            'starts_at' => $past->copy()->subHour(),
            'ends_at' => $past->copy()->subHour()->addMinutes(20),
        ]);

        $this->actingAs($mine->user)
            ->get('/profesional/buscar/mis-turnos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/AppointmentSearch')
                ->where('by', null)
                ->has('appointments.data', 0));

        $this->actingAs($mine->user)
            ->get('/profesional/buscar/mis-turnos?by=date&date='.$past->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/AppointmentSearch')
                ->where('by', 'date')
                ->has('appointments.data', 1)
                ->where('appointments.data.0.id', $ownPast->id));

        $this->actingAs($patient->user)
            ->getJson('/profesional/buscar/mis-turnos')
            ->assertForbidden();
        $this->actingAs($admin)
            ->getJson('/profesional/buscar/mis-turnos')
            ->assertForbidden();
        $this->actingAs($patient->user)
            ->getJson('/profesional/buscar/mis-cirugias')
            ->assertForbidden();
        $this->actingAs($admin)
            ->getJson('/profesional/buscar/mis-cirugias')
            ->assertForbidden();

        $orphan = User::factory()->create();
        $orphan->assignRole('professional');
        $this->actingAs($orphan)
            ->getJson('/profesional/buscar/mis-turnos')
            ->assertForbidden();
        $this->actingAs($orphan)
            ->getJson('/profesional/buscar/mis-cirugias')
            ->assertForbidden();
    }

    public function test_sidebar_buscador_nav_contract_without_reservas_or_search_child(): void
    {
        $sidebar = File::get(base_path('resources/js/Components/Layout/Sidebar.tsx'));

        $this->assertStringNotContainsString("label: 'Reservas'", $sidebar);
        $this->assertStringNotContainsString('/admin/reservas', $sidebar);
        $this->assertStringContainsString("id: 'buscador'", $sidebar);
        $this->assertStringContainsString("id: 'buscador-portal'", $sidebar);
        $this->assertStringContainsString("label: 'Buscador'", $sidebar);
        $this->assertStringNotContainsString("label: 'Historial'", $sidebar);
        $this->assertStringContainsString("href: '/admin/buscar/turnos', label: 'Turnos'", $sidebar);
        $this->assertStringContainsString("href: '/admin/buscar/cirugias', label: 'Cirugías'", $sidebar);
        $this->assertStringContainsString("href: '/profesional/buscar/mis-turnos', label: 'Mis turnos'", $sidebar);
        $this->assertStringContainsString("href: '/profesional/buscar/mis-cirugias', label: 'Mis cirugías'", $sidebar);

        $this->assertStringNotContainsString("section: 'search'", $sidebar);
        $this->assertStringContainsString("{ section: 'pending', label: 'Pendientes' }", $sidebar);
        $this->assertStringContainsString("{ section: 'requested', label: 'Solicitadas' }", $sidebar);
        $this->assertStringContainsString("{ section: 'approved', label: 'Aprobadas' }", $sidebar);

        $this->assertStringNotContainsString('/historial/', $sidebar);
    }

    public function test_docs_and_package_json_aligned_with_search(): void
    {
        $design = File::get(base_path('new-design.md'));
        $this->assertStringContainsString('/admin/buscar/turnos', $design);
        $this->assertStringContainsString('/admin/buscar/cirugias', $design);
        $this->assertStringContainsString('/profesional/buscar/mis-turnos', $design);
        $this->assertStringContainsString('/profesional/buscar/mis-cirugias', $design);
        $this->assertStringContainsString('redirect compat → `/admin/buscar/turnos`', $design);
        $this->assertStringContainsString('d49 — Buscador search-first', $design);

        $common = File::get(base_path('docs/professional-surgeries/COMMON.md'));
        $this->assertStringContainsString('**Sin** hijo Buscador', $common);
        $this->assertStringContainsString('`pending` / `requested` / `approved`', $common);
        $this->assertStringContainsString('/profesional/buscar/mis-cirugias', $common);

        $package = File::get(base_path('package.json'));
        $this->assertStringNotContainsString('"packageManager"', $package);
    }

    private function professionalRoutesSlice(string $routes): string
    {
        $start = strpos($routes, "Route::prefix('profesional')");
        $end = strpos($routes, "Route::prefix('admin')");
        $this->assertNotFalse($start);
        $this->assertNotFalse($end);
        $this->assertGreaterThan($start, $end);

        return substr($routes, $start, $end - $start);
    }
}
