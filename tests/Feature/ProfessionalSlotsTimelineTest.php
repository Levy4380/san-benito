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
            ->get('/admin/profesionales/'.$professional->id.'/horarios')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Slots')
                ->where('selectedDate', '2026-10-07')
                ->has('professional.slot_duration_minutes')
                ->has('timeline.windows', 2)
                ->where('timeline.windows.0.id', $overnight->id)
                ->where('timeline.windows.1.id', $morning->id)
                ->has('timeline.appointments', 1)
                ->where('timeline.appointments.0.id', $booked->id)
                ->where('timeline.appointments.0.patient.id', $patient->id)
                ->has('timeline.appointments.0.specialty')
                ->where('timeline.now', '2026-10-07 10:30:00')
                ->where('bookingTones.2026-10-07', 'has')
                ->where('bookingTones.2026-10-08', 'has')
                ->where('bookingTones.2026-10-09', 'empty')
                ->has('bookingTones', 31)
                ->has('slots', 4)
                ->where('slots.0.starts_at', '2026-10-07 10:40:00')
                ->where('slots.1.starts_at', '2026-10-07 11:00:00')
                ->where('slots.2.starts_at', '2026-10-07 11:20:00')
                ->where('slots.3.starts_at', '2026-10-07 11:40:00')
                ->has('patients'));
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
            ->get('/admin/profesionales/'.$professional->id.'/horarios?date=2026-09-15')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('selectedDate', '2026-09-15')
                ->has('timeline.windows', 1)
                ->has('timeline.appointments', 0)
                ->has('bookingTones', 30)
                ->has('slots', 0));
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
}
