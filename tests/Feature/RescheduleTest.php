<?php

namespace Tests\Feature;

use App\Enums\SurgeryStatus;
use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Professional;
use App\Models\Surgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

/** d51 — Reprogramar turno (staff + professional own) y cirugía programada futura. */
class RescheduleTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        $this->travelTo(Carbon::parse('2026-12-01 10:00:00'));
    }

    public function test_professional_moves_own_appointment_to_a_free_slot_keeping_the_row(): void
    {
        $professional = $this->professionalWithWindow();
        $appointment = $this->appointmentAt('2026-12-02 09:00:00', $professional);
        $appointment->update(['attendance' => null]);

        $this->actingAs($professional->user)
            ->from('/profesional/agenda')
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 10:00:00'])
            ->assertRedirect('/profesional/agenda')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast.message', fn (string $message) => str_contains($message, 'Reprogramaste el turno de')
                && str_contains($message, '02/12 a las 10:00'));

        $moved = $appointment->fresh();
        $this->assertSame('2026-12-02 10:00:00', $moved->starts_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-12-02 10:20:00', $moved->ends_at->format('Y-m-d H:i:s'));
        $this->assertSame($appointment->patient_id, $moved->patient_id);
        $this->assertSame($appointment->specialty_id, $moved->specialty_id);
        $this->assertSame(1, Appointment::query()->count());
    }

    public function test_professional_cannot_overbook_but_staff_can(): void
    {
        $professional = $this->professionalWithWindow();
        $appointment = $this->appointmentAt('2026-12-02 09:00:00', $professional);

        $this->actingAs($professional->user)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 15:00:00'])
            ->assertSessionHasErrors('starts_at');
        $this->assertSame('2026-12-02 09:00:00', $appointment->fresh()->starts_at->format('Y-m-d H:i:s'));

        $this->actingAs($this->makeAdmin())
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 15:00:00'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast.message', fn (string $message) => str_contains($message, 'como sobreturno'));

        $this->assertSame('2026-12-02 15:00:00', $appointment->fresh()->starts_at->format('Y-m-d H:i:s'));
        $this->assertTrue(AvailabilityWindow::query()
            ->forProfessional($professional)
            ->where('starts_at', '2026-12-02 15:00:00')
            ->where('ends_at', '2026-12-02 15:20:00')
            ->exists());
    }

    public function test_rejects_taken_same_past_and_started(): void
    {
        $professional = $this->professionalWithWindow();
        $appointment = $this->appointmentAt('2026-12-02 09:00:00', $professional);
        $this->appointmentAt('2026-12-02 09:20:00', $professional);
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 09:20:00'])
            ->assertSessionHasErrors('starts_at');
        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 09:00:00'])
            ->assertSessionHasErrors('starts_at');
        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-01 08:00:00'])
            ->assertSessionHasErrors('starts_at');
        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => 'mañana'])
            ->assertSessionHasErrors('starts_at');

        $started = $this->appointmentAt('2026-12-01 09:50:00', $professional);
        $this->actingAs($admin)
            ->patch("/appointments/{$started->id}/reschedule", ['starts_at' => '2026-12-02 11:00:00'])
            ->assertSessionHasErrors('appointment');

        $this->assertSame('2026-12-02 09:00:00', $appointment->fresh()->starts_at->format('Y-m-d H:i:s'));
    }

    public function test_only_staff_or_the_professional_of_the_agenda_can_reschedule(): void
    {
        $owner = $this->professionalWithWindow();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();
        $appointment = $this->appointmentAt('2026-12-02 09:00:00', $owner, $patient->id);

        // 403 → RejectedRequestHandler redirects to the actor's landing.
        $this->actingAs($other->user)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 10:00:00'])
            ->assertRedirect('/profesional');
        $this->actingAs($patient->user)
            ->patch("/appointments/{$appointment->id}/reschedule", ['starts_at' => '2026-12-02 10:00:00'])
            ->assertRedirect('/paciente');
        $this->actingAs($patient->user)
            ->getJson("/appointments/{$appointment->id}/reschedule-options")
            ->assertForbidden();

        $this->assertSame('2026-12-02 09:00:00', $appointment->fresh()->starts_at->format('Y-m-d H:i:s'));
    }

    public function test_options_list_free_slots_and_flag_overbook_for_staff_only(): void
    {
        $professional = $this->professionalWithWindow();
        $appointment = $this->appointmentAt('2026-12-02 09:00:00', $professional);

        $this->actingAs($professional->user)
            ->getJson("/appointments/{$appointment->id}/reschedule-options")
            ->assertOk()
            ->assertJsonPath('date', '2026-12-02')
            ->assertJsonPath('overbook', false)
            ->assertJsonPath('slots.0.starts_at', '2026-12-02 09:20:00')
            ->assertJsonCount(1, 'timeline.appointments');

        $this->actingAs($this->makeAdmin())
            ->getJson("/appointments/{$appointment->id}/reschedule-options?date=2026-12-03")
            ->assertOk()
            ->assertJsonPath('date', '2026-12-03')
            ->assertJsonPath('overbook', true)
            ->assertJsonCount(0, 'slots');
    }

    public function test_staff_reschedules_a_future_scheduled_surgery_ignoring_its_own_slot(): void
    {
        $admin = $this->makeAdmin();
        $surgery = Surgery::factory()->scheduled(Carbon::parse('2026-12-03 09:00:00'))->create([
            'ends_at' => '2026-12-03 10:00:00',
            'health_insurance_id' => null,
            'requested_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get("/admin/cirugias/{$surgery->id}/programar")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('date', '2026-12-03')
                ->where('surgery.id', $surgery->id)
                ->has('daySurgeries', 0));

        // Overlaps its own current range: not a clash.
        $this->actingAs($admin)
            ->post("/admin/cirugias/{$surgery->id}/programar", [
                'starts_at' => '2026-12-03 09:30:00',
                'ends_at' => '2026-12-03 11:00:00',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast.message', 'Cirugía reprogramada: 2026-12-03 09:30–11:00.');

        $moved = $surgery->fresh();
        $this->assertSame(SurgeryStatus::Scheduled, $moved->status);
        $this->assertSame('2026-12-03 09:30:00', $moved->starts_at->format('Y-m-d H:i:s'));
    }

    public function test_surgery_reschedule_still_checks_other_surgeries_and_rejects_started_ones(): void
    {
        $admin = $this->makeAdmin();
        $surgery = Surgery::factory()->scheduled(Carbon::parse('2026-12-03 09:00:00'))->create([
            'ends_at' => '2026-12-03 10:00:00',
            'requested_by_user_id' => $admin->id,
        ]);
        Surgery::factory()->scheduled(Carbon::parse('2026-12-03 12:00:00'))->create([
            'ends_at' => '2026-12-03 13:00:00',
            'requested_by_user_id' => $admin->id,
        ]);
        $started = Surgery::factory()->scheduled(Carbon::parse('2026-12-01 09:00:00'))->create([
            'ends_at' => '2026-12-01 11:00:00',
            'requested_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin)->postJson("/admin/cirugias/{$surgery->id}/programar", [
            'starts_at' => '2026-12-03 12:30:00',
            'ends_at' => '2026-12-03 13:30:00',
        ])->assertStatus(422)->assertJsonValidationErrors('starts_at');

        $this->actingAs($admin)->postJson("/admin/cirugias/{$started->id}/programar", [
            'starts_at' => '2026-12-04 09:00:00',
            'ends_at' => '2026-12-04 10:00:00',
        ])->assertStatus(422)->assertJsonValidationErrors('status');

        $this->assertSame('2026-12-03 09:00:00', $surgery->fresh()->starts_at->format('Y-m-d H:i:s'));
    }

    public function test_professional_reschedules_own_surgery_only(): void
    {
        $owner = $this->makeProfessional();
        $other = $this->makeProfessional();
        $surgery = Surgery::factory()->scheduled(Carbon::parse('2026-12-03 09:00:00'))->create([
            'ends_at' => '2026-12-03 10:00:00',
            'professional_id' => $owner->id,
            'requested_by_user_id' => $owner->user->id,
        ]);

        $this->actingAs($other->user)
            ->post("/profesional/cirugias/{$surgery->id}/programar", [
                'starts_at' => '2026-12-04 09:00:00',
                'ends_at' => '2026-12-04 10:00:00',
            ])
            ->assertRedirect('/profesional');

        $this->actingAs($owner->user)
            ->post("/profesional/cirugias/{$surgery->id}/programar", [
                'starts_at' => '2026-12-04 09:00:00',
                'ends_at' => '2026-12-04 10:00:00',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast.message', 'Cirugía reprogramada: 2026-12-04 09:00–10:00.');

        $this->assertSame('2026-12-04 09:00:00', $surgery->fresh()->starts_at->format('Y-m-d H:i:s'));
    }

    private function professionalWithWindow(): Professional
    {
        $professional = $this->makeProfessional();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-12-02 09:00:00',
            'ends_at' => '2026-12-02 13:00:00',
        ]);

        return $professional;
    }

    private function appointmentAt(string $start, Professional $professional, ?int $patientId = null): Appointment
    {
        $startsAt = Carbon::parse($start);

        return Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patientId ?? $this->makePatient()->id,
            'specialty_id' => $professional->specialties()->firstOrFail()->id,
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(20),
        ]);
    }
}
