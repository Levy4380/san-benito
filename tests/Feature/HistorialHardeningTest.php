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

class HistorialHardeningTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_named_routes_and_paths_match_historial_contract(): void
    {
        $this->assertSame('/admin/historial/turnos', route('admin.historial.turnos', absolute: false));
        $this->assertSame('/admin/historial/cirugias', route('admin.historial.cirugias', absolute: false));
        $this->assertSame('/profesional/historial/mis-turnos', route('professional.historial.mis-turnos', absolute: false));
        $this->assertSame('/profesional/historial/mis-cirugias', route('professional.historial.mis-cirugias', absolute: false));
        $this->assertSame('/admin/reservas', route('admin.appointments.index', absolute: false));

        $routes = File::get(base_path('routes/web.php'));
        $this->assertStringNotContainsString("/profesional/historial/turnos'", $routes);
        $this->assertStringNotContainsString('/profesional/historial/turnos"', $routes);
        $this->assertDoesNotMatchRegularExpression(
            "#Route::get\\('/historial/cirugias'#",
            $this->professionalHistorialRoutesSlice($routes),
        );
        $this->assertStringContainsString("Route::get('/historial/mis-turnos'", $routes);
        $this->assertStringContainsString("Route::get('/historial/mis-cirugias'", $routes);
    }

    public function test_admin_reservas_is_redirect_only_not_inertia_list(): void
    {
        $routes = File::get(base_path('routes/web.php'));
        $this->assertMatchesRegularExpression(
            "#Route::get\\('/reservas',\\s*fn\\s*\\(\\)\\s*=>\\s*redirect\\(\\)->route\\('admin\\.historial\\.turnos'\\)\\)#",
            $routes,
        );
        $this->assertStringNotContainsString(
            "Route::get('/reservas', [AdminAppointmentController::class, 'index'])",
            $routes,
        );

        $admin = $this->makeAdmin();
        $this->actingAs($admin)
            ->get('/admin/reservas')
            ->assertRedirect(route('admin.historial.turnos'));
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

    public function test_admin_historial_turnos_lists_only_past_appointments(): void
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
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => $future,
            'ends_at' => $future->copy()->addMinutes(20),
        ]);

        $this->actingAs($admin)
            ->get('/admin/historial/turnos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Appointments')
                ->has('appointments.data', 1)
                ->where('appointments.data.0.id', $pastAppointment->id));
    }

    public function test_admin_and_portal_section_history_redirects_preserve_query(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=history&q=abc')
            ->assertRedirect(route('admin.historial.cirugias', ['q' => 'abc']));

        $this->actingAs($professional->user)
            ->get('/profesional/cirugias?section=history&q=xyz')
            ->assertRedirect(route('professional.historial.mis-cirugias', ['q' => 'xyz']));
    }

    public function test_admin_historial_cirugias_renders_history_section(): void
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
            ->get('/admin/historial/cirugias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Surgeries')
                ->where('section', 'history')
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.note', 'Historial hardening.'));
    }

    public function test_professional_historial_scopes_and_forbids_wrong_roles(): void
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
            ->get('/profesional/historial/mis-turnos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/History')
                ->has('appointments', 1)
                ->where('appointments.0.id', $ownPast->id));

        $this->actingAs($patient->user)
            ->getJson('/profesional/historial/mis-turnos')
            ->assertForbidden();
        $this->actingAs($admin)
            ->getJson('/profesional/historial/mis-turnos')
            ->assertForbidden();
        $this->actingAs($patient->user)
            ->getJson('/profesional/historial/mis-cirugias')
            ->assertForbidden();
        $this->actingAs($admin)
            ->getJson('/profesional/historial/mis-cirugias')
            ->assertForbidden();

        $orphan = User::factory()->create();
        $orphan->assignRole('professional');
        $this->actingAs($orphan)
            ->getJson('/profesional/historial/mis-turnos')
            ->assertForbidden();
        $this->actingAs($orphan)
            ->getJson('/profesional/historial/mis-cirugias')
            ->assertForbidden();
    }

    public function test_sidebar_historial_nav_contract_without_reservas_or_history_child(): void
    {
        $sidebar = File::get(base_path('resources/js/Components/Layout/Sidebar.tsx'));

        $this->assertStringNotContainsString("label: 'Reservas'", $sidebar);
        $this->assertStringNotContainsString('/admin/reservas', $sidebar);
        $this->assertStringContainsString("id: 'historial'", $sidebar);
        $this->assertStringContainsString("id: 'historial-portal'", $sidebar);
        $this->assertStringContainsString("label: 'Historial'", $sidebar);
        $this->assertStringContainsString("href: '/admin/historial/turnos', label: 'Turnos'", $sidebar);
        $this->assertStringContainsString("href: '/admin/historial/cirugias', label: 'Cirugías'", $sidebar);
        $this->assertStringContainsString("href: '/profesional/historial/mis-turnos', label: 'Mis turnos'", $sidebar);
        $this->assertStringContainsString("href: '/profesional/historial/mis-cirugias', label: 'Mis cirugías'", $sidebar);

        $this->assertStringNotContainsString("section: 'history'", $sidebar);
        $this->assertStringContainsString("{ section: 'pending', label: 'Pendientes' }", $sidebar);
        $this->assertStringContainsString("{ section: 'requested', label: 'Solicitadas' }", $sidebar);
        $this->assertStringContainsString("{ section: 'approved', label: 'Aprobadas' }", $sidebar);

        $this->assertStringNotContainsString('/profesional/historial/turnos', $sidebar);
        $this->assertDoesNotMatchRegularExpression(
            '#/profesional/historial/cirugias(?!/)#',
            $sidebar,
        );
    }

    public function test_docs_and_package_json_aligned_with_historial(): void
    {
        $design = File::get(base_path('new-design.md'));
        $this->assertStringContainsString('/admin/historial/turnos', $design);
        $this->assertStringContainsString('/admin/historial/cirugias', $design);
        $this->assertStringContainsString('/profesional/historial/mis-turnos', $design);
        $this->assertStringContainsString('/profesional/historial/mis-cirugias', $design);
        $this->assertStringContainsString('redirect compat → `/admin/historial/turnos`', $design);

        $common = File::get(base_path('docs/professional-surgeries/COMMON.md'));
        $this->assertStringContainsString('**Sin** hijo Historial', $common);
        $this->assertStringContainsString('`pending` / `requested` / `approved`', $common);
        $this->assertStringContainsString('/profesional/historial/mis-cirugias', $common);

        $package = File::get(base_path('package.json'));
        $this->assertStringNotContainsString('"packageManager"', $package);
    }

    private function professionalHistorialRoutesSlice(string $routes): string
    {
        $start = strpos($routes, "Route::prefix('profesional')");
        $end = strpos($routes, "Route::prefix('admin')");
        $this->assertNotFalse($start);
        $this->assertNotFalse($end);
        $this->assertGreaterThan($start, $end);

        return substr($routes, $start, $end - $start);
    }
}
