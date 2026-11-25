<?php

namespace Tests\Feature;

use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

/** d50: every feed of the shared «Detalle del turno» modal carries patient + professional (user, specialties) + specialty. */
class AppointmentDetailPayloadTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        $this->travelTo(Carbon::parse('2026-12-01 10:00:00'));
    }

    public function test_staff_agenda_feeds_include_what_the_detail_modal_reads(): void
    {
        $professional = $this->makeProfessional();
        $patient = $this->makePatient();
        $appointment = Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'specialty_id' => $professional->specialties()->firstOrFail()->id,
            'starts_at' => '2026-12-02 09:00:00',
            'ends_at' => '2026-12-02 09:20:00',
        ]);
        $admin = $this->makeAdmin();

        foreach ([
            "/professionals/{$professional->id}/agenda?date=2026-12-02",
            "/patients/{$patient->id}/agenda?date=2026-12-02",
            "/appointments/{$appointment->id}/reschedule-options",
        ] as $url) {
            $this->actingAs($admin)
                ->getJson($url)
                ->assertOk()
                ->assertJsonStructure(['timeline' => ['appointments' => [[
                    'patient' => ['name', 'dni'],
                    'professional' => ['user' => ['name'], 'specialties'],
                    'specialty' => ['name'],
                ]]]]);
        }
    }
}
