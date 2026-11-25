<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ProfessionalSlotsTimelineTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        $this->travelTo(Carbon::parse('2026-10-07 10:30:00'));
    }

    public function test_admin_without_date_gets_today_timeline_of_that_professional_only(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();

        $morning = AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 12:00:00',
        ]);
        $overnight = AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-06 22:00:00',
            'ends_at' => '2026-10-07 02:00:00',
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-08 09:00:00',
            'ends_at' => '2026-10-08 12:00:00',
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $other->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 12:00:00',
        ]);

        $booked = Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 09:20:00',
        ]);
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-08 09:00:00',
            'ends_at' => '2026-10-08 09:20:00',
        ]);
        Appointment::factory()->create([
            'professional_id' => $other->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 09:20:00',
        ]);

        $this->actingAs($admin)
            ->getJson('/professionals/'.$professional->id.'/agenda')
            ->assertOk()
            ->assertJsonPath('selectedDate', '2026-10-07')
            ->assertJsonPath('professional.slot_duration_minutes', $professional->slot_duration_minutes)
            ->assertJsonCount(2, 'timeline.windows')
            ->assertJsonPath('timeline.windows.0.id', $overnight->id)
            ->assertJsonPath('timeline.windows.1.id', $morning->id)
            ->assertJsonCount(1, 'timeline.appointments')
            ->assertJsonPath('timeline.appointments.0.id', $booked->id)
            ->assertJsonPath('timeline.appointments.0.patient.id', $patient->id)
            ->assertJsonPath('timeline.now', '2026-10-07 10:30:00')
            ->assertJsonPath('bookingTones.2026-10-07', 'has')
            ->assertJsonPath('bookingTones.2026-10-08', 'has')
            ->assertJsonPath('bookingTones.2026-10-09', 'empty')
            ->assertJsonCount(31, 'bookingTones')
            ->assertJsonCount(4, 'slots')
            ->assertJsonPath('slots.0.starts_at', '2026-10-07 10:40:00')
            ->assertJsonPath('slots.1.starts_at', '2026-10-07 11:00:00')
            ->assertJsonPath('slots.2.starts_at', '2026-10-07 11:20:00')
            ->assertJsonPath('slots.3.starts_at', '2026-10-07 11:40:00')
            ->assertJsonStructure(['patients']);
    }

    public function test_admin_with_date_gets_that_day(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-09-15 09:00:00',
            'ends_at' => '2026-09-15 10:00:00',
        ]);

        $this->actingAs($admin)
            ->getJson('/professionals/'.$professional->id.'/agenda?date=2026-09-15')
            ->assertOk()
            ->assertJsonPath('selectedDate', '2026-09-15')
            ->assertJsonCount(1, 'timeline.windows')
            ->assertJsonCount(0, 'timeline.appointments')
            ->assertJsonCount(30, 'bookingTones')
            ->assertJsonCount(0, 'slots');
    }

    public function test_professional_agenda_gets_day_timeline_props(): void
    {
        $professional = $this->makeProfessional();
        $patient = $this->makePatient();

        $overnight = AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-06 22:00:00',
            'ends_at' => '2026-10-07 02:00:00',
        ]);
        $morning = AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 12:00:00',
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-08 09:00:00',
            'ends_at' => '2026-10-08 12:00:00',
        ]);
        $booked = Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 09:20:00',
        ]);

        $this->actingAs($professional->user)
            ->get('/profesional/agenda')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/Agenda')
                ->where('selectedDate', '2026-10-07')
                ->where('now', '2026-10-07 10:30:00')
                ->has('professional.slot_duration_minutes')
                ->has('windows', 2)
                ->where('windows.0.id', $overnight->id)
                ->where('windows.1.id', $morning->id)
                ->has('appointments', 1)
                ->where('appointments.0.id', $booked->id)
                ->where('appointments.0.patient.id', $patient->id)
                ->has('appointments.0.specialty'));
    }

    public function test_patient_keeps_current_props_without_timeline(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales/'.$professional->id.'/horarios')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Slots')
                ->where('selectedDate', null)
                ->missing('timeline')
                ->missing('bookingTones'));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales/'.$professional->id.'/horarios?date=2026-10-07')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('selectedDate', '2026-10-07')
                ->missing('timeline')
                ->missing('bookingTones'));
    }

    public function test_staff_agenda_json_matches_the_staff_day_and_rejects_other_roles(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();
        $patient = $this->makePatient();

        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 09:20:00',
        ]);

        $this->actingAs($patient->user)
            ->getJson('/professionals/'.$professional->id.'/agenda')
            ->assertForbidden();

        $this->actingAs($admin)
            ->getJson('/professionals/'.$professional->id.'/agenda')
            ->assertOk()
            ->assertJsonPath('selectedDate', '2026-10-07')
            ->assertJsonPath('timeline.now', '2026-10-07 10:30:00')
            ->assertJsonPath('bookingTones.2026-10-07', 'has')
            ->assertJsonCount(1, 'timeline.appointments');

        $this->actingAs($admin)
            ->getJson('/professionals/'.$professional->id.'/agenda?date=2026-10-08')
            ->assertOk()
            ->assertJsonPath('selectedDate', '2026-10-08')
            ->assertJsonCount(0, 'timeline.appointments');
    }
}
