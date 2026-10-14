<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AdminAssignAppointmentTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        $this->travelTo(Carbon::parse('2026-10-07 08:00:00'));
    }

    public function test_admin_assigns_any_patient_and_links_them_to_the_professional(): void
    {
        $admin = $this->makeAdmin();
        [$professional, $specialtyId] = $this->professionalWithWindow();
        $patient = Patient::factory()->withoutUser()->create();

        $this->actingAs($admin)
            ->post('/professionals/'.$professional->id.'/appointments', [
                'starts_at' => '2026-10-07 09:20:00',
                'patient_id' => $patient->id,
                'specialty_id' => $specialtyId,
            ])
            ->assertRedirect('/admin/profesionales/'.$professional->id.'/horarios?date=2026-10-07&specialty_id='.$specialtyId)
            ->assertSessionHas('toast');

        $this->assertDatabaseHas('appointments', [
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'specialty_id' => $specialtyId,
            'starts_at' => '2026-10-07 09:20:00',
            'ends_at' => '2026-10-07 09:40:00',
        ]);
        $this->assertDatabaseHas('professional_patient', ['professional_id' => $professional->id, 'patient_id' => $patient->id]);
    }

    public function test_super_admin_can_assign(): void
    {
        [$professional, $specialtyId] = $this->professionalWithWindow();
        $patient = $this->makePatient();

        $this->actingAs($this->makeSuperAdmin())
            ->post('/professionals/'.$professional->id.'/appointments', [
                'starts_at' => '2026-10-07 09:00:00',
                'patient_id' => $patient->id,
                'specialty_id' => $specialtyId,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', ['professional_id' => $professional->id, 'patient_id' => $patient->id]);
    }

    public function test_taken_slot_or_foreign_specialty_is_rejected(): void
    {
        $admin = $this->makeAdmin();
        [$professional, $specialtyId] = $this->professionalWithWindow();
        $patient = $this->makePatient();
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 09:20:00',
        ]);
        $foreign = Specialty::query()->whereNotIn('id', $professional->specialties()->pluck('specialties.id'))->firstOrFail();

        $this->actingAs($admin)
            ->post('/professionals/'.$professional->id.'/appointments', [
                'starts_at' => '2026-10-07 09:00:00',
                'patient_id' => $patient->id,
                'specialty_id' => $specialtyId,
            ])
            ->assertSessionHasErrors('starts_at');

        $this->actingAs($admin)
            ->post('/professionals/'.$professional->id.'/appointments', [
                'starts_at' => '2026-10-07 09:20:00',
                'patient_id' => $patient->id,
                'specialty_id' => $foreign->id,
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_patient_and_professional_cannot_use_staff_assign(): void
    {
        [$professional, $specialtyId] = $this->professionalWithWindow();
        $patient = $this->makePatient();
        $payload = [
            'starts_at' => '2026-10-07 09:00:00',
            'patient_id' => $patient->id,
            'specialty_id' => $specialtyId,
        ];

        $this->actingAs($patient->user)->post('/professionals/'.$professional->id.'/appointments', $payload);
        $this->actingAs($professional->user)->post('/professionals/'.$professional->id.'/appointments', $payload);

        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_slots_page_lists_patients_only_for_staff(): void
    {
        [$professional] = $this->professionalWithWindow();
        $patient = $this->makePatient();

        $this->actingAs($this->makeAdmin())
            ->get('/admin/profesionales/'.$professional->id.'/horarios')
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.id', $patient->id)
                ->where('patients.0.dni', $patient->dni));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales/'.$professional->id.'/horarios')
            ->assertInertia(fn ($page) => $page->missing('patients'));
    }

    /**
     * @return array{0: Professional, 1: int}
     */
    private function professionalWithWindow(): array
    {
        $professional = $this->makeProfessional();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 10:00:00',
        ]);

        return [$professional, (int) $professional->specialties()->value('specialties.id')];
    }
}
