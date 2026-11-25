<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ProfessionalAppointmentSearchTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_professional_searches_only_own_past_and_future_appointments(): void
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
        $ownFuture = Appointment::factory()->create([
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

        $this->assertSame('/profesional/buscar/mis-turnos', route('professional.search.my-appointments', absolute: false));

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
                ->where('appointments.data.0.id', $ownPast->id)
                ->where('appointments.data.0.starts_at', $past->format('Y-m-d H:i:s')));

        $this->actingAs($mine->user)
            ->get('/profesional/buscar/mis-turnos?by=patient&patient_id='.$patient->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('by', 'patient')
                ->has('appointments.data', 2)
                ->where('appointments.data.0.id', $ownFuture->id)
                ->where('appointments.data.1.id', $ownPast->id));
    }

    public function test_patient_and_admin_cannot_access_professional_search(): void
    {
        $this->actingAs($this->makePatient()->user)
            ->getJson('/profesional/buscar/mis-turnos')
            ->assertForbidden();

        $this->actingAs($this->makeAdmin())
            ->getJson('/profesional/buscar/mis-turnos')
            ->assertForbidden();
    }

    public function test_orphan_professional_role_without_ficha_gets_403(): void
    {
        $orphan = User::factory()->create();
        $orphan->assignRole('professional');
        $this->assertNull($orphan->professional);

        $this->actingAs($orphan)
            ->getJson('/profesional/buscar/mis-turnos')
            ->assertForbidden();
    }
}
