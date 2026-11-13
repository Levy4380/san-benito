<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ProfessionalAppointmentHistoryTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_professional_sees_only_own_past_appointments(): void
    {
        $mine = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();
        $past = now()->subDay()->setTime(10, 0, 0);
        $future = now()->addWeek()->setTime(10, 0, 0);

        $ownPast = Appointment::factory()->create([
            'professional_id' => $mine->id,
            'patient_id' => $patient->id,
            'starts_at' => $past,
            'ends_at' => $past->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'professional_id' => $mine->id,
            'patient_id' => $patient->id,
            'starts_at' => $future,
            'ends_at' => $future->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'professional_id' => $other->id,
            'patient_id' => $patient->id,
            'starts_at' => $past->copy()->subDay(),
            'ends_at' => $past->copy()->subDay()->addMinutes(20),
        ]);

        $this->assertSame('/profesional/historial/mis-turnos', route('professional.historial.mis-turnos', absolute: false));

        $this->actingAs($mine->user)
            ->get('/profesional/historial/mis-turnos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/History')
                ->has('appointments', 1)
                ->where('appointments.0.id', $ownPast->id)
                ->where('appointments.0.starts_at', $past->format('Y-m-d H:i:s'))
                ->where('backHref', '/profesional/agenda')
                ->where('backLabel', 'Mi agenda'));
    }

    public function test_patient_and_admin_cannot_access_professional_historial(): void
    {
        $this->actingAs($this->makePatient()->user)
            ->getJson('/profesional/historial/mis-turnos')
            ->assertForbidden();

        $this->actingAs($this->makeAdmin())
            ->getJson('/profesional/historial/mis-turnos')
            ->assertForbidden();
    }

    public function test_orphan_professional_role_without_ficha_gets_403(): void
    {
        $orphan = User::factory()->create();
        $orphan->assignRole('professional');
        $this->assertNull($orphan->professional);

        $this->actingAs($orphan)
            ->getJson('/profesional/historial/mis-turnos')
            ->assertForbidden();
    }
}
