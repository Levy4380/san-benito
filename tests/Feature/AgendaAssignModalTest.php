<?php

namespace Tests\Feature;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AgendaAssignModalTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        $this->travelTo(Carbon::parse('2026-10-07 10:30:00'));
    }

    public function test_options_without_date_pick_the_first_day_with_free_slots(): void
    {
        $doctor = $this->makeDoctor();
        $linked = $this->makePatient();
        $this->makePatient();
        $doctor->patients()->syncWithoutDetaching([$linked->id]);
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => '2026-10-09 09:00:00',
            'ends_at' => '2026-10-09 10:00:00',
        ]);

        $this->actingAs($doctor->user)
            ->getJson('/agenda/assign-options')
            ->assertOk()
            ->assertJsonPath('date', '2026-10-09')
            ->assertJsonPath('today', '2026-10-07')
            ->assertJsonPath('days', ['2026-10-09'])
            ->assertJsonPath('slots.0.starts_at', '2026-10-09 09:00:00')
            ->assertJsonCount(1, 'patients')
            ->assertJsonPath('patients.0.id', $linked->id)
            ->assertJsonPath('patients.0.dni', $linked->dni)
            ->assertJsonCount($doctor->specialties()->count(), 'specialties')
            ->assertJsonPath('slotMinutes', $doctor->slot_duration_minutes)
            ->assertJsonCount(1, 'timeline.windows')
            ->assertJsonCount(0, 'timeline.appointments')
            ->assertJsonPath('timeline.now', '2026-10-07 10:30:00');
    }

    public function test_options_for_a_past_day_have_no_slots(): void
    {
        $doctor = $this->makeDoctor();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => '2026-10-06 09:00:00',
            'ends_at' => '2026-10-06 10:00:00',
        ]);

        $this->actingAs($doctor->user)
            ->getJson('/agenda/assign-options?date=2026-10-06')
            ->assertOk()
            ->assertJsonPath('date', '2026-10-06')
            ->assertJsonCount(0, 'slots');
    }

    public function test_options_are_doctor_only(): void
    {
        $this->actingAs($this->makePatient()->user)
            ->getJson('/agenda/assign-options')
            ->assertForbidden();
    }

    public function test_assign_returns_to_the_page_it_came_from(): void
    {
        $doctor = $this->makeDoctor();
        $linked = $this->makePatient();
        $doctor->patients()->syncWithoutDetaching([$linked->id]);
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => '2026-10-09 09:00:00',
            'ends_at' => '2026-10-09 10:00:00',
        ]);

        $this->actingAs($doctor->user)
            ->from('/my-patients')
            ->post('/agenda/appointments', [
                'starts_at' => '2026-10-09 09:00:00',
                'patient_id' => $linked->id,
                'specialty_id' => $doctor->specialties()->firstOrFail()->id,
            ])
            ->assertRedirect('/my-patients')
            ->assertSessionHas('toast.message', 'Asignaste el turno de '.$linked->name.' el 09/10 a las 09:00.');
    }
}
