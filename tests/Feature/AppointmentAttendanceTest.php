<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Professional;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AppointmentAttendanceTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_status_is_scheduled_until_one_day_after_start_then_past(): void
    {
        $this->travelTo(Carbon::parse('2026-11-24 10:00:00'));
        $appointment = $this->appointmentAt(now()->subHours(2));

        $this->assertSame('scheduled', $appointment->fresh()->status);
        $this->assertSame('scheduled', $this->appointmentAt(now()->addDay())->status);

        $this->travelTo(Carbon::parse('2026-11-25 07:59:59'));
        $this->assertSame('scheduled', $appointment->fresh()->status);

        $this->travelTo(Carbon::parse('2026-11-25 08:00:00'));
        $this->assertSame('past', $appointment->fresh()->status);
        $this->assertSame('past', $appointment->fresh()->toArray()['status']);
    }

    public function test_professional_marks_own_started_appointment_and_can_change_or_clear_it(): void
    {
        $professional = $this->makeProfessional();
        $appointment = $this->appointmentAt(now()->subMinutes(10), $professional);

        $this->actingAs($professional->user)
            ->from('/profesional/agenda')
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'attended'])
            ->assertRedirect('/profesional/agenda')
            ->assertSessionHas('toast.message', 'El turno quedó como Atendido.');
        $this->assertSame('attended', $appointment->fresh()->status);

        $this->actingAs($professional->user)
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'absent'])
            ->assertSessionHasNoErrors();
        $this->assertSame('absent', $appointment->fresh()->status);

        $this->actingAs($professional->user)
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => null])
            ->assertSessionHas('toast.message', 'El turno quedó como Programado.');
        $this->assertNull($appointment->fresh()->attendance);
        $this->assertSame('scheduled', $appointment->fresh()->status);
    }

    public function test_attendance_mark_wins_over_past(): void
    {
        $appointment = $this->appointmentAt(now()->subDays(3));
        $this->assertSame('past', $appointment->status);

        $this->actingAs($this->makeAdmin())
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'absent'])
            ->assertSessionHasNoErrors();

        $this->assertSame('absent', $appointment->fresh()->status);
    }

    public function test_future_appointment_cannot_be_marked(): void
    {
        $professional = $this->makeProfessional();
        $appointment = $this->appointmentAt(now()->addHour(), $professional);

        $this->actingAs($professional->user)
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'attended'])
            ->assertSessionHasErrors('attendance');

        $this->assertNull($appointment->fresh()->attendance);
    }

    public function test_invalid_or_missing_value_is_rejected(): void
    {
        $admin = $this->makeAdmin();
        $appointment = $this->appointmentAt(now()->subHour());

        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'completed'])
            ->assertSessionHasErrors('attendance');
        $this->actingAs($admin)
            ->patch("/appointments/{$appointment->id}/attendance", [])
            ->assertSessionHasErrors('attendance');

        $this->assertNull($appointment->fresh()->attendance);
    }

    public function test_only_staff_or_the_professional_of_the_agenda_can_mark(): void
    {
        $owner = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();
        $appointment = $this->appointmentAt(now()->subHour(), $owner, $patient->id);

        // 403 → RejectedRequestHandler redirects to the actor's landing.
        $this->actingAs($other->user)
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'attended'])
            ->assertRedirect('/profesional');
        $this->actingAs($patient->user)
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'attended'])
            ->assertRedirect('/paciente');

        $this->assertNull($appointment->fresh()->attendance);

        $this->actingAs($this->makeSuperAdmin())
            ->patch("/appointments/{$appointment->id}/attendance", ['attendance' => 'attended'])
            ->assertSessionHasNoErrors();
        $this->assertSame('attended', $appointment->fresh()->status);
    }

    private function appointmentAt(Carbon $start, ?Professional $professional = null, ?int $patientId = null): Appointment
    {
        $professional ??= $this->makeProfessional();

        return Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patientId ?? $this->makePatient()->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(20),
        ]);
    }
}
