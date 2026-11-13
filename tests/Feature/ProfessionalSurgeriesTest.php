<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\SurgeryStatus;
use App\Http\Requests\Professional\StoreSurgeryRequest;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\Surgery;
use App\Models\User;
use App\Policies\SurgeryPolicy;
use App\Services\AdminSurgeryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ProfessionalSurgeriesTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        Carbon::setTestNow('2026-10-14 15:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_policy_own_create_passes_and_schedule_needs_ownership(): void
    {
        $policy = new SurgeryPolicy;
        $professional = $this->makeProfessional();
        $other = $this->makeProfessional();
        $admin = $this->makeAdmin();
        $ownSurgery = Surgery::factory()->toSchedule()->create([
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
        ]);
        $foreignSurgery = Surgery::factory()->toSchedule()->create([
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
        ]);

        $this->assertTrue($policy->create($professional->user));
        $this->assertTrue($policy->viewAny($professional->user));
        $this->assertTrue($policy->view($professional->user, $ownSurgery));
        $this->assertFalse($policy->view($professional->user, $foreignSurgery));
        $this->assertTrue($policy->schedule($professional->user, $ownSurgery));
        $this->assertFalse($policy->schedule($professional->user, $foreignSurgery));
        $this->assertFalse($policy->markRequested($professional->user, $ownSurgery));
        $this->assertFalse($policy->approve($professional->user, $ownSurgery));

        $this->assertTrue($policy->markRequested($admin, $ownSurgery));
        $this->assertTrue($policy->approve($admin, $ownSurgery));
        $this->assertTrue($policy->schedule($admin, $foreignSurgery));
    }

    public function test_schedule_fails_without_professional_entity(): void
    {
        $policy = new SurgeryPolicy;
        $professional = $this->makeProfessional();
        $surgery = Surgery::factory()->toSchedule()->create([
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
        ]);

        $orphan = User::factory()->create();
        $orphan->assignRole('professional');

        $this->assertFalse($policy->create($orphan));
        $this->assertNull($orphan->professional);
        $this->assertFalse($policy->schedule($orphan, $surgery));
        $this->assertFalse($policy->view($orphan, $surgery));
    }

    public function test_store_request_rejects_unlinked_patient(): void
    {
        $professional = $this->makeProfessional();
        $linked = $this->makePatient(['name' => 'Paciente Vinculado']);
        $stranger = $this->makePatient(['name' => 'Paciente Ajeno']);
        $professional->patients()->syncWithoutDetaching([$linked->id]);

        $this->assertStorePasses($professional->user, [
            'patient_id' => $linked->id,
            'health_insurance_id' => null,
            'note' => 'Cirugía particular.',
            'professional_id' => 999_999,
        ]);

        try {
            $this->assertStorePasses($professional->user, [
                'patient_id' => $stranger->id,
                'note' => 'No vinculado.',
            ]);
            $this->fail('Expected ValidationException for unlinked patient.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                ['Solo podés solicitar cirugías para pacientes ya vinculados.'],
                $exception->errors()['patient_id'] ?? null,
            );
        }
    }

    public function test_scoped_counts_differ_from_global_when_others_exist(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();

        Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
        ]);
        Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
        ]);
        Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
        ]);

        $service = app(AdminSurgeryService::class);
        $global = $service->counts();
        $scoped = $service->counts($mine->id);

        $this->assertSame(3, $global['pending']);
        $this->assertSame(1, $scoped['pending']);
        $this->assertNotEquals($global, $scoped);

        $this->actingAs($mine->user)
            ->get('/profesional')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('surgeryNavCounts.pending', 1));

        $this->actingAs($this->makeAdmin())
            ->get('/admin/reservas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('surgeryNavCounts.pending', 3));
    }

    public function test_search_linked_patients_and_create_options_omit_professionals(): void
    {
        $professional = $this->makeProfessional();
        $linked = $this->makePatient(['name' => 'Ana Cirugia']);
        $stranger = $this->makePatient(['name' => 'Ana Ajena']);
        $professional->patients()->syncWithoutDetaching([$linked->id]);

        $service = app(AdminSurgeryService::class);
        $found = $service->searchLinkedPatients($professional, 'Ana');

        $this->assertCount(1, $found);
        $this->assertSame($linked->id, $found->first()->id);
        $this->assertFalse($found->contains(fn (Patient $patient): bool => $patient->id === $stranger->id));

        $options = $service->createOptionsForProfessional();
        $this->assertArrayHasKey('healthInsurances', $options);
        $this->assertArrayNotHasKey('professionals', $options);
    }

    public function test_portal_list_create_and_store_scope_to_actor_professional(): void
    {
        $professional = $this->makeProfessional();
        $other = $this->makeProfessional();
        $linked = $this->makePatient(['name' => 'Paciente Portal']);
        $professional->patients()->syncWithoutDetaching([$linked->id]);
        $insurance = HealthInsurance::factory()->create(['name' => 'OS Portal']);

        $this->actingAs($professional->user)
            ->get('/profesional/cirugias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Professional/Surgeries'));

        $this->actingAs($professional->user)
            ->getJson('/profesional/cirugias/crear')
            ->assertOk()
            ->assertJsonStructure(['healthInsurances'])
            ->assertJsonMissingPath('professionals');

        $this->actingAs($professional->user)
            ->post('/profesional/cirugias', [
                'patient_id' => $linked->id,
                'professional_id' => $other->id,
                'health_insurance_id' => null,
                'note' => 'Alta particular portal.',
            ])
            ->assertRedirect('/profesional/cirugias?section=approved');

        $this->assertDatabaseHas('surgeries', [
            'patient_id' => $linked->id,
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
            'health_insurance_id' => null,
            'status' => SurgeryStatus::ToSchedule->value,
            'note' => 'Alta particular portal.',
        ]);
        $this->assertDatabaseMissing('surgeries', [
            'professional_id' => $other->id,
            'note' => 'Alta particular portal.',
        ]);

        $this->actingAs($professional->user)
            ->post('/profesional/cirugias', [
                'patient_id' => $linked->id,
                'health_insurance_id' => $insurance->id,
                'note' => 'Con obra portal.',
            ])
            ->assertRedirect('/profesional/cirugias?section=pending');

        $this->assertDatabaseHas('surgeries', [
            'note' => 'Con obra portal.',
            'professional_id' => $professional->id,
            'status' => SurgeryStatus::Pending->value,
            'health_insurance_id' => $insurance->id,
        ]);
    }

    public function test_portal_rejects_unlinked_patient_and_foreign_schedule(): void
    {
        $professional = $this->makeProfessional();
        $other = $this->makeProfessional();
        $stranger = $this->makePatient();
        $foreign = Surgery::factory()->toSchedule()->create([
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
        ]);

        $this->actingAs($professional->user)
            ->postJson('/profesional/cirugias', [
                'patient_id' => $stranger->id,
                'note' => 'Sin vínculo.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id']);

        $this->actingAs($professional->user)
            ->getJson('/profesional/cirugias/'.$foreign->id.'/programar')
            ->assertForbidden();

        $this->actingAs($professional->user)
            ->postJson('/profesional/cirugias/'.$foreign->id.'/programar', [
                'starts_at' => '2026-10-16 09:00:00',
                'ends_at' => '2026-10-16 10:00:00',
            ])
            ->assertForbidden();
    }

    public function test_portal_has_no_request_or_approve_and_admin_staff_actions_stay_forbidden(): void
    {
        $professional = $this->makeProfessional();
        $own = Surgery::factory()->create([
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
            'status' => SurgeryStatus::Pending,
        ]);

        $this->actingAs($professional->user)
            ->postJson('/admin/cirugias/'.$own->id.'/solicitar')
            ->assertForbidden();

        $this->actingAs($professional->user)
            ->postJson('/admin/cirugias/'.$own->id.'/aprobar')
            ->assertForbidden();

        $this->actingAs($professional->user)
            ->postJson('/profesional/cirugias/'.$own->id.'/solicitar')
            ->assertNotFound();

        $this->actingAs($professional->user)
            ->postJson('/profesional/cirugias/'.$own->id.'/aprobar')
            ->assertNotFound();
    }

    public function test_portal_calendar_scopes_tones_and_day_list_to_own_scheduled(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();

        $own = Surgery::factory()->scheduled(Carbon::parse('2026-10-20 09:00:00'))->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
            'starts_at' => '2026-10-20 09:00:00',
            'ends_at' => '2026-10-20 10:00:00',
        ]);
        Surgery::factory()->scheduled(Carbon::parse('2026-10-20 11:00:00'))->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'starts_at' => '2026-10-20 11:00:00',
            'ends_at' => '2026-10-20 12:00:00',
        ]);
        Surgery::factory()->scheduled(Carbon::parse('2026-10-20 14:00:00'))->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'starts_at' => '2026-10-20 14:00:00',
            'ends_at' => '2026-10-20 15:00:00',
        ]);

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias/calendario?date=2026-10-20&month=2026-10-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/SurgeryCalendar')
                ->where('scheduling', false)
                ->where('date', '2026-10-20')
                ->where('tones.2026-10-20', 'has')
                ->has('daySurgeries', 1)
                ->where('daySurgeries.0.id', $own->id)
                ->missing('daySurgeries.1'));

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias/calendario?date=2026-10-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('scheduling', false)->where('date', '2026-10-01'));
    }

    public function test_portal_schedule_defaults_to_tomorrow_and_uses_institutional_busy(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $own = Surgery::factory()->toSchedule()->create([
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
        ]);
        $foreignBusy = Surgery::factory()->scheduled(Carbon::parse('2026-10-15 09:00:00'))->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'starts_at' => '2026-10-15 09:00:00',
            'ends_at' => '2026-10-15 10:00:00',
        ]);

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias/'.$own->id.'/programar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/SurgeryCalendar')
                ->where('scheduling', true)
                ->where('date', '2026-10-15')
                ->where('surgery.id', $own->id)
                ->has('daySurgeries', 0)
                ->has('busySurgeries', 1)
                ->where('busySurgeries.0.id', $foreignBusy->id));

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias/'.$own->id.'/programar?date=2026-10-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('date', '2026-10-15'));
    }

    public function test_portal_schedules_own_and_rejects_foreign_clash_and_wrong_status(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();

        Surgery::factory()->scheduled(Carbon::parse('2026-10-20 10:00:00'))->create([
            'patient_id' => $patient->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'starts_at' => '2026-10-20 10:00:00',
            'ends_at' => '2026-10-20 11:00:00',
        ]);

        $own = Surgery::factory()->toSchedule()->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
        ]);
        $blocked = Surgery::factory()->toSchedule()->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
        ]);
        $pending = Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
            'status' => SurgeryStatus::Pending,
        ]);
        $foreign = Surgery::factory()->toSchedule()->create([
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
        ]);

        $this->actingAs($mine->user)
            ->postJson('/profesional/cirugias/'.$blocked->id.'/programar', [
                'starts_at' => '2026-10-20 10:30:00',
                'ends_at' => '2026-10-20 11:30:00',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('starts_at');

        $this->actingAs($mine->user)
            ->post('/profesional/cirugias/'.$own->id.'/programar', [
                'starts_at' => '2026-10-20 11:00:00',
                'ends_at' => '2026-10-20 12:00:00',
            ])
            ->assertRedirect('/profesional/cirugias?section=approved&surgery='.$own->id);

        $this->assertSame(SurgeryStatus::Scheduled, $own->refresh()->status);
        $this->assertSame('2026-10-20 11:00:00', $own->starts_at?->format('Y-m-d H:i:s'));

        $this->actingAs($mine->user)
            ->getJson('/profesional/cirugias/'.$foreign->id.'/programar')
            ->assertForbidden();

        $this->actingAs($mine->user)
            ->postJson('/profesional/cirugias/'.$foreign->id.'/programar', [
                'starts_at' => '2026-10-21 09:00:00',
                'ends_at' => '2026-10-21 10:00:00',
            ])
            ->assertForbidden();

        $this->actingAs($mine->user)
            ->getJson('/profesional/cirugias/'.$pending->id.'/programar')
            ->assertStatus(422);

        $this->actingAs($mine->user)
            ->postJson('/profesional/cirugias/'.$pending->id.'/programar', [
                'starts_at' => '2026-10-21 09:00:00',
                'ends_at' => '2026-10-21 10:00:00',
            ])
            ->assertStatus(422);

        $this->actingAs($mine->user)
            ->get('/profesional/agenda')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Professional/Agenda'));
    }

    public function test_permission_matrix_keeps_own_arm_and_denies_staff_catalog_to_professional(): void
    {
        foreach (['own.surgeries.view', 'own.surgeries.create', 'own.surgeries.schedule'] as $own) {
            $this->assertContains($own, Permission::names());
            $this->assertContains($own, Permission::namesForRole('professional'));
            $this->assertNotContains($own, Permission::namesForRole('patient'));
            $this->assertNotContains($own, Permission::namesForRole('admin'));
            $this->assertNotContains($own, Permission::namesForRole('super_admin'));
        }

        $this->assertNotContains('surgeries.catalog.view', Permission::namesForRole('professional'));
        $this->assertNotContains('own.surgeries.request', Permission::names());
        $this->assertNotContains('own.surgeries.approve', Permission::names());
        $this->assertContains('surgeries.catalog.view', Permission::namesForRole('admin'));
        $this->assertContains('surgeries.create', Permission::namesForRole('admin'));
    }

    public function test_portal_sections_list_only_own_surgeries(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();
        $insurance = $patient->healthInsurances()->create(['name' => 'OS Scope']);

        $ownPending = Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Pending,
            'note' => 'Mía pending.',
        ]);
        $foreignPending = Surgery::factory()->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Pending,
            'note' => 'Ajena pending.',
        ]);
        $ownApproved = Surgery::factory()->toSchedule()->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
            'note' => 'Mía approved.',
        ]);
        $foreignApproved = Surgery::factory()->toSchedule()->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'note' => 'Ajena approved.',
        ]);
        $ownRequested = Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Requested,
            'note' => 'Mía requested.',
        ]);
        $ownHistory = Surgery::factory()->scheduled(Carbon::parse('2026-10-10 09:00:00'))->create([
            'patient_id' => $patient->id,
            'professional_id' => $mine->id,
            'requested_by_user_id' => $mine->user->id,
            'note' => 'Mía history.',
        ]);
        Surgery::factory()->scheduled(Carbon::parse('2026-10-10 11:00:00'))->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $other->id,
            'requested_by_user_id' => $other->user->id,
            'note' => 'Ajena history.',
        ]);

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias?section=pending')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/Surgeries')
                ->where('section', 'pending')
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.id', $ownPending->id)
                ->where('surgeries.data', fn ($rows): bool => collect($rows)->pluck('id')->doesntContain($foreignPending->id)));

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias?section=requested')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.id', $ownRequested->id));

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias?section=approved')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.id', $ownApproved->id)
                ->where('surgeries.data', fn ($rows): bool => collect($rows)->pluck('id')->doesntContain($foreignApproved->id)));

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias?section=history')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.id', $ownHistory->id));

        $this->actingAs($mine->user)
            ->get('/profesional/cirugias?section=approved&surgery='.$foreignApproved->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('openSurgery', null));
    }

    public function test_orphan_professional_role_cannot_use_portal_mutations(): void
    {
        $orphan = User::factory()->create();
        $orphan->assignRole('professional');
        $linkedOwner = $this->makeProfessional();
        $patient = $this->makePatient();
        $linkedOwner->patients()->syncWithoutDetaching([$patient->id]);
        $foreign = Surgery::factory()->toSchedule()->create([
            'professional_id' => $linkedOwner->id,
            'requested_by_user_id' => $linkedOwner->user->id,
        ]);

        $this->assertNull($orphan->professional);

        // HTML 403s redirect home (303); JSON keeps 403 — DoD is the JSON contract.
        $this->actingAs($orphan)
            ->getJson('/profesional/cirugias')
            ->assertForbidden();

        $this->actingAs($orphan)
            ->postJson('/profesional/cirugias', [
                'patient_id' => $patient->id,
                'note' => 'Sin entidad professional.',
            ])
            ->assertForbidden();

        $this->actingAs($orphan)
            ->getJson('/profesional/cirugias/'.$foreign->id.'/programar')
            ->assertForbidden();

        $this->actingAs($orphan)
            ->postJson('/profesional/cirugias/'.$foreign->id.'/programar', [
                'starts_at' => '2026-10-16 09:00:00',
                'ends_at' => '2026-10-16 10:00:00',
            ])
            ->assertForbidden();
    }

    public function test_pending_and_requested_cannot_schedule_and_docs_keep_own_arm(): void
    {
        $professional = $this->makeProfessional();
        $patient = $this->makePatient();
        $insurance = $patient->healthInsurances()->create(['name' => 'OS CTA']);

        $pending = Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Pending,
        ]);
        $requested = Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Requested,
        ]);
        $approved = Surgery::factory()->toSchedule()->create([
            'patient_id' => $patient->id,
            'professional_id' => $professional->id,
            'requested_by_user_id' => $professional->user->id,
        ]);

        foreach ([$pending, $requested] as $blocked) {
            $this->actingAs($professional->user)
                ->getJson('/profesional/cirugias/'.$blocked->id.'/programar')
                ->assertStatus(422);

            $this->actingAs($professional->user)
                ->postJson('/profesional/cirugias/'.$blocked->id.'/programar', [
                    'starts_at' => '2026-10-16 09:00:00',
                    'ends_at' => '2026-10-16 10:00:00',
                ])
                ->assertStatus(422);
        }

        $this->actingAs($professional->user)
            ->get('/profesional/cirugias/'.$approved->id.'/programar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/SurgeryCalendar')
                ->where('scheduling', true)
                ->where('surgery.id', $approved->id)
                ->where('surgery.status', SurgeryStatus::ToSchedule->value));

        $cirugias = file_get_contents(base_path('cirugias.md'));
        $design = file_get_contents(base_path('new-design.md'));
        $sidebar = file_get_contents(base_path('resources/js/Components/Layout/Sidebar.tsx'));
        $portalPage = file_get_contents(base_path('resources/js/Pages/Professional/Surgeries.tsx'));

        $this->assertIsString($cirugias);
        $this->assertIsString($design);
        $this->assertIsString($sidebar);
        $this->assertIsString($portalPage);

        $this->assertStringContainsString('own.surgeries.view', $cirugias);
        $this->assertStringContainsString('Mis Cirugías', $cirugias);
        $this->assertStringNotContainsString('No hay `own.surgeries.*` ni páginas bajo `/profesional`', $cirugias);
        $this->assertStringContainsString('own.surgeries.view', $design);
        $this->assertStringContainsString('d47 — Cirugías aparte de reservas (staff + portal own)', $design);
        $this->assertStringContainsString("label: 'Mis Cirugías'", $sidebar);
        $this->assertStringContainsString("label: 'Cirugías'", $sidebar);
        $this->assertStringContainsString('Calendario', $portalPage);
        $this->assertStringContainsString('Solicitar cirugía', $portalPage);
        $this->assertStringContainsString('canMarkRequested={false}', $portalPage);
        $this->assertStringContainsString('canApprove={false}', $portalPage);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertStorePasses(User $user, array $payload): void
    {
        $request = StoreSurgeryRequest::create('/profesional/cirugias', 'POST', $payload);
        $request->setUserResolver(fn () => $user);
        $request->setContainer($this->app);
        $request->setRedirector($this->app->make('redirect'));

        $request->validateResolved();

        $this->assertArrayNotHasKey('professional_id', $request->validated());
    }
}
