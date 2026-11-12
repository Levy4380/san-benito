<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\SurgeryStatus;
use App\Models\Appointment;
use App\Models\ClinicSchedule;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Surgery;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AdminSurgeriesTest extends TestCase
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

    public function test_permissions_stay_on_the_staff_arm(): void
    {
        $this->assertContains('surgeries.catalog.view', Permission::namesForRole('admin'));
        $this->assertContains('surgeries.schedule', Permission::namesForRole('super_admin'));
        $this->assertNotContains('surgeries.catalog.view', Permission::namesForRole('patient'));
        $this->assertNotContains('surgeries.create', Permission::namesForRole('professional'));
        $this->assertNotContains('surgeries.manage', Permission::names());
        $this->assertFalse(collect(Permission::names())->contains(fn (string $name): bool => str_starts_with($name, 'own.surgeries.') || str_starts_with($name, 'doctors.')));
    }

    public function test_staff_sees_counts_and_portals_do_not(): void
    {
        $admin = $this->makeAdmin();
        $super = $this->makeSuperAdmin();
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();

        $this->actingAs($admin)->get('/admin')->assertRedirect('/admin/reservas');

        $this->actingAs($admin)
            ->get('/admin/reservas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('surgeryNavCounts.pending', 0)
                ->where('surgeryNavCounts.requested', 0)
                ->where('surgeryNavCounts.approved', 0)
                ->where('surgeryNavCounts.history', 0));

        $this->actingAs($super)
            ->get('/admin/cirugias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Surgeries')->where('section', 'pending')->has('surgeryNavCounts'));

        $this->actingAs($patient->user)->getJson('/admin/cirugias')->assertForbidden();
        $this->actingAs($professional->user)->getJson('/admin/cirugias/crear')->assertForbidden();
        $this->actingAs($admin)
            ->getJson('/admin/cirugias/crear')
            ->assertOk()
            ->assertJsonStructure(['professionals', 'healthInsurances']);
        $this->actingAs($patient->user)->postJson('/admin/cirugias', [])->assertForbidden();

        $this->actingAs($patient->user)
            ->get('/paciente')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('surgeryNavCounts', null));

        $this->actingAs($professional->user)
            ->get('/profesional')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('surgeryNavCounts', null));
    }

    public function test_particular_goes_to_schedule_and_insurance_stays_pending(): void
    {
        $admin = $this->makeAdmin();
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $insurance = $patient->healthInsurances()->create(['name' => 'OSDE Cirugías']);
        $patient->healthInsurances()->sync([$insurance->id]);

        $this->actingAs($admin)
            ->post('/admin/cirugias', [
                'patient_id' => $patient->id,
                'professional_id' => $professional->id,
                'health_insurance_id' => null,
                'note' => 'Particular, sin obra.',
            ])
            ->assertRedirect('/admin/cirugias?section=approved');

        $this->assertDatabaseHas('surgeries', [
            'patient_id' => $patient->id,
            'professional_id' => $professional->id,
            'requested_by_user_id' => $admin->id,
            'health_insurance_id' => null,
            'status' => SurgeryStatus::ToSchedule->value,
            'starts_at' => null,
            'ends_at' => null,
        ]);
        $this->assertDatabaseCount('professional_patient', 0);
        $this->assertDatabaseCount('patient_health_insurance', 1);

        $this->actingAs($admin)
            ->post('/admin/cirugias', [
                'patient_id' => $patient->id,
                'professional_id' => $professional->id,
                'health_insurance_id' => $insurance->id,
                'note' => 'Con obra social.',
            ])
            ->assertRedirect('/admin/cirugias?section=pending');

        $this->assertDatabaseHas('surgeries', [
            'note' => 'Con obra social.',
            'status' => SurgeryStatus::Pending->value,
            'health_insurance_id' => $insurance->id,
        ]);
        $this->assertDatabaseCount('patient_health_insurance', 1);
        $this->assertDatabaseCount('professional_patient', 0);
    }

    public function test_insurance_only_advances_pending_requested_to_schedule_scheduled(): void
    {
        $admin = $this->makeAdmin();
        $surgery = $this->pendingSurgery($admin->id);

        $this->actingAs($admin)
            ->postJson('/admin/cirugias/'.$surgery->id.'/aprobar')
            ->assertStatus(422);

        $this->actingAs($admin)
            ->post('/admin/cirugias/'.$surgery->id.'/solicitar')
            ->assertRedirect('/admin/cirugias?section=requested&surgery='.$surgery->id);

        $surgery->refresh();
        $this->assertSame(SurgeryStatus::Requested, $surgery->status);
        $this->assertTrue($admin->can('approve', $surgery));
        $this->assertTrue($admin->can('schedule', $surgery));
        $this->assertFalse($this->makeProfessional()->user->can('schedule', $surgery));

        $this->actingAs($admin)
            ->postJson('/admin/cirugias/'.$surgery->id.'/programar', [
                'starts_at' => '2026-10-15 09:00:00',
                'ends_at' => '2026-10-15 10:00:00',
            ])
            ->assertStatus(422);

        $this->actingAs($admin)
            ->post('/admin/cirugias/'.$surgery->id.'/aprobar')
            ->assertRedirect('/admin/cirugias?section=approved&surgery='.$surgery->id);

        $surgery->refresh();
        $this->assertSame(SurgeryStatus::ToSchedule, $surgery->status);
        $this->assertNull($surgery->starts_at);
        $this->assertNull($surgery->ends_at);

        $this->actingAs($admin)
            ->post('/admin/cirugias/'.$surgery->id.'/programar', [
                'starts_at' => '2026-10-15 09:00:00',
                'ends_at' => '2026-10-15 10:00:00',
            ])
            ->assertRedirect('/admin/cirugias?section=approved&surgery='.$surgery->id);

        $surgery->refresh();
        $this->assertSame(SurgeryStatus::Scheduled, $surgery->status);
        $this->assertSame('2026-10-15 09:00:00', $surgery->starts_at?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-10-15 10:00:00', $surgery->ends_at?->format('Y-m-d H:i:s'));
    }

    public function test_overlap_is_institutional_and_ignores_appointments(): void
    {
        $admin = $this->makeAdmin();
        $firstProfessional = $this->makeProfessional();
        $secondProfessional = $this->makeProfessional();
        $patient = $this->makePatient();

        Surgery::factory()->scheduled(Carbon::parse('2026-10-20 10:00:00'))->create([
            'patient_id' => $patient->id,
            'professional_id' => $firstProfessional->id,
            'requested_by_user_id' => $admin->id,
            'starts_at' => '2026-10-20 10:00:00',
            'ends_at' => '2026-10-20 11:00:00',
        ]);

        Appointment::factory()->create([
            'professional_id' => $secondProfessional->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-21 10:00:00',
            'ends_at' => '2026-10-21 10:20:00',
        ]);

        $blocked = $this->toSchedule($admin->id, $secondProfessional->id, $patient->id);
        $touching = $this->toSchedule($admin->id, $secondProfessional->id, $patient->id);
        $besideAppointment = $this->toSchedule($admin->id, $secondProfessional->id, $patient->id);

        $this->actingAs($admin)
            ->postJson('/admin/cirugias/'.$blocked->id.'/programar', [
                'starts_at' => '2026-10-20 10:30:00',
                'ends_at' => '2026-10-20 11:30:00',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('starts_at');

        $this->actingAs($admin)
            ->post('/admin/cirugias/'.$touching->id.'/programar', [
                'starts_at' => '2026-10-20 11:00:00',
                'ends_at' => '2026-10-20 12:00:00',
            ])
            ->assertRedirect();

        $this->assertSame(SurgeryStatus::Scheduled, $touching->refresh()->status);

        $this->actingAs($admin)
            ->post('/admin/cirugias/'.$besideAppointment->id.'/programar', [
                'starts_at' => '2026-10-21 10:00:00',
                'ends_at' => '2026-10-21 10:30:00',
            ])
            ->assertRedirect();

        $this->assertSame(SurgeryStatus::Scheduled, $besideAppointment->refresh()->status);
    }

    public function test_schedule_rejects_past_short_and_unordered_ranges(): void
    {
        $admin = $this->makeAdmin();
        $past = $this->toSchedule($admin->id);
        $short = $this->toSchedule($admin->id);
        $backwards = $this->toSchedule($admin->id);

        $this->actingAs($admin)->postJson('/admin/cirugias/'.$past->id.'/programar', [
            'starts_at' => '2026-10-14 09:00:00',
            'ends_at' => '2026-10-14 10:00:00',
        ])->assertStatus(422);

        $this->actingAs($admin)->postJson('/admin/cirugias/'.$short->id.'/programar', [
            'starts_at' => '2026-10-16 09:00:00',
            'ends_at' => '2026-10-16 09:20:00',
        ])->assertStatus(422);

        $this->actingAs($admin)->postJson('/admin/cirugias/'.$backwards->id.'/programar', [
            'starts_at' => '2026-10-16 11:00:00',
            'ends_at' => '2026-10-16 10:00:00',
        ])->assertStatus(422);
    }

    public function test_sections_filters_and_patient_search(): void
    {
        $admin = $this->makeAdmin();
        $cardio = Specialty::factory()->create(['name' => 'Cardiología quirófano']);
        $clinica = Specialty::query()->firstOrFail();
        $cardioProfessional = $this->makeProfessional([], ['specialty_ids' => [$cardio->id]]);
        $clinicaProfessional = $this->makeProfessional([], ['specialty_ids' => [$clinica->id]]);
        $patient = $this->makePatient(['name' => 'Zoe Cirugia', 'email' => 'zoe.cirugia@sanbenito.test'], ['dni' => '44556677']);
        $chart = Patient::factory()->withoutUser()->create([
            'name' => 'Ficha Sola',
            'dni' => '11223344',
            'email' => 'ficha.sola@sanbenito.test',
        ]);
        $insurance = $patient->healthInsurances()->create(['name' => 'Swiss Cirugías']);

        $pending = Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $cardioProfessional->id,
            'requested_by_user_id' => $admin->id,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Pending,
            'note' => 'Pendiente.',
        ]);
        $toSchedule = Surgery::factory()->toSchedule()->create([
            'patient_id' => $patient->id,
            'professional_id' => $clinicaProfessional->id,
            'requested_by_user_id' => $admin->id,
            'health_insurance_id' => null,
            'note' => 'A programar.',
        ]);
        Surgery::factory()->scheduled(Carbon::parse('2026-10-20 14:00:00'))->create([
            'patient_id' => $patient->id,
            'professional_id' => $cardioProfessional->id,
            'requested_by_user_id' => $admin->id,
            'note' => 'Futura.',
        ]);
        Surgery::factory()->scheduled(Carbon::parse('2026-10-10 09:00:00'))->create([
            'patient_id' => $patient->id,
            'professional_id' => $clinicaProfessional->id,
            'requested_by_user_id' => $admin->id,
            'note' => 'Pasada.',
        ]);

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=pending&status=scheduled')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('section', 'pending')
                ->where('filters.status', null)
                ->has('surgeries.data', 1)
                ->where('surgeries.data.0.id', $pending->id));

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=approved')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('surgeries.data', 2)
                ->where('surgeries.data.0.id', $toSchedule->id)
                ->where('surgeries.data.0.status', 'to_schedule')
                ->where('surgeries.data.1.status', 'scheduled')
                ->where('surgeries.data.1.opens_scheduled_group', true));

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=approved&status=to_schedule')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('surgeries.data', 1)->where('surgeries.data.0.status', 'to_schedule'));

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=approved&health_insurance_id=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('surgeries.data', 0));

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=history')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('surgeries.data', 1)->where('surgeries.data.0.note', 'Pasada.'));

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=pending&q=44556677')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('surgeries.data', 1));

        $this->actingAs($admin)->getJson('/admin/cirugias/pacientes?q=z')->assertOk()->assertJsonCount(0, 'patients');
        $this->actingAs($admin)
            ->getJson('/admin/cirugias/pacientes?q=11223344')
            ->assertOk()
            ->assertJsonPath('patients.0.id', $chart->id);
        $this->actingAs($admin)
            ->getJson('/admin/cirugias/pacientes?q=zoe.cirugia')
            ->assertOk()
            ->assertJsonPath('patients.0.id', $patient->id);
    }

    public function test_calendar_defaults_to_tomorrow_and_keeps_past_days_when_browsing(): void
    {
        $admin = $this->makeAdmin();
        $surgery = $this->toSchedule($admin->id);

        $this->actingAs($admin)
            ->get('/admin/cirugias/'.$surgery->id.'/programar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SurgeryCalendar')
                ->where('scheduling', true)
                ->where('date', '2026-10-15')
                ->where('suggestion.starts_at', '07:00')
                ->where('suggestion.ends_at', '08:00'));

        $this->actingAs($admin)
            ->get('/admin/cirugias/'.$surgery->id.'/programar?date=2026-10-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('date', '2026-10-15'));

        $this->actingAs($admin)
            ->get('/admin/cirugias/calendario?date=2026-10-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('scheduling', false)->where('date', '2026-10-01'));

        $this->actingAs($admin)
            ->getJson('/admin/cirugias/'.$surgery->id.'/solicitar')
            ->assertStatus(405);
    }

    public function test_suggestion_uses_clinic_hours_and_is_empty_when_the_day_is_full(): void
    {
        $admin = $this->makeAdmin();
        ClinicSchedule::query()->firstOrFail()->update([
            'opens_at' => '08:00:00',
            'closes_at' => '18:00:00',
        ]);
        $surgery = $this->toSchedule($admin->id);

        $this->actingAs($admin)
            ->get('/admin/cirugias/'.$surgery->id.'/programar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('suggestion.starts_at', '08:00')
                ->where('suggestion.ends_at', '09:00')
                ->where('gaps.0.0', 8 * 60)
                ->where('gaps.0.1', 18 * 60));

        Surgery::factory()->scheduled(Carbon::parse('2026-10-15 08:00:00'))->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $this->makeProfessional()->id,
            'requested_by_user_id' => $admin->id,
            'starts_at' => '2026-10-15 08:00:00',
            'ends_at' => '2026-10-15 18:00:00',
        ]);

        $this->actingAs($admin)
            ->get('/admin/cirugias/'.$surgery->id.'/programar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('suggestion', null)
                ->where('gaps', []));
    }

    public function test_open_surgery_is_loaded_when_it_is_not_on_the_first_page(): void
    {
        $admin = $this->makeAdmin();

        foreach (range(1, 25) as $ignored) {
            $this->toSchedule($admin->id);
        }

        $scheduled = Surgery::factory()->scheduled(Carbon::parse('2026-10-20 14:00:00'))->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $this->makeProfessional()->id,
            'requested_by_user_id' => $admin->id,
            'note' => 'Fuera de la primera página.',
        ]);

        $this->actingAs($admin)
            ->get('/admin/cirugias?section=approved&surgery='.$scheduled->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('openSurgery.id', $scheduled->id)
                ->where('openSurgery.note', 'Fuera de la primera página.')
                ->where('surgeries.data', fn ($rows): bool => collect($rows)->pluck('id')->doesntContain($scheduled->id)));
    }

    public function test_portals_cannot_move_a_surgery_and_deleting_a_professional_keeps_it(): void
    {
        $admin = $this->makeAdmin();
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $surgery = $this->toSchedule($admin->id, $professional->id, $patient->id);

        foreach ([$patient->user, $professional->user] as $user) {
            $this->actingAs($user)->getJson('/admin/cirugias/pacientes?q=ana')->assertForbidden();
            $this->actingAs($user)->postJson('/admin/cirugias/'.$surgery->id.'/solicitar')->assertForbidden();
            $this->actingAs($user)->postJson('/admin/cirugias/'.$surgery->id.'/aprobar')->assertForbidden();
            $this->actingAs($user)->getJson('/admin/cirugias/'.$surgery->id.'/programar')->assertForbidden();
            $this->actingAs($user)->postJson('/admin/cirugias/'.$surgery->id.'/programar', [
                'starts_at' => '2026-10-16 09:00:00',
                'ends_at' => '2026-10-16 10:00:00',
            ])->assertForbidden();
        }

        try {
            $professional->delete();
            $this->fail('Borrar el profesional no tiene que borrar la cirugía.');
        } catch (QueryException) {
            $this->assertModelExists($surgery);
            $this->assertModelExists($professional);
        }
    }

    public function test_mark_requested_rejects_a_surgery_without_insurance(): void
    {
        $admin = $this->makeAdmin();
        $surgery = Surgery::factory()->create([
            'patient_id' => $this->makePatient()->id,
            'professional_id' => $this->makeProfessional()->id,
            'requested_by_user_id' => $admin->id,
            'health_insurance_id' => null,
            'status' => SurgeryStatus::Pending,
            'note' => 'No debería existir así.',
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/cirugias/'.$surgery->id.'/solicitar')
            ->assertStatus(422);
    }

    private function pendingSurgery(int $adminId): Surgery
    {
        $patient = $this->makePatient();
        $insurance = $patient->healthInsurances()->create(['name' => 'OSDE '.uniqid()]);

        return Surgery::factory()->create([
            'patient_id' => $patient->id,
            'professional_id' => $this->makeProfessional()->id,
            'requested_by_user_id' => $adminId,
            'health_insurance_id' => $insurance->id,
            'status' => SurgeryStatus::Pending,
            'note' => 'Obra social.',
        ]);
    }

    private function toSchedule(int $adminId, ?int $professionalId = null, ?int $patientId = null): Surgery
    {
        return Surgery::factory()->toSchedule()->create([
            'patient_id' => $patientId ?? $this->makePatient()->id,
            'professional_id' => $professionalId ?? $this->makeProfessional()->id,
            'requested_by_user_id' => $adminId,
            'health_insurance_id' => null,
            'note' => 'A programar.',
        ]);
    }
}
