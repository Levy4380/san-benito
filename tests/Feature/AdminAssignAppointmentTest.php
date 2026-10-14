<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Doctor;
use App\Models\Patient;
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

    public function test_admin_assigns_any_patient_and_links_them_to_the_doctor(): void
    {
        $admin = $this->makeAdmin();
        [$doctor, $specialtyId] = $this->doctorWithWindow();
        $patient = Patient::factory()->withoutUser()->create();

        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctor->id.'/appointments', [
                'starts_at' => '2026-10-07 09:20:00',
                'patient_id' => $patient->id,
                'specialty_id' => $specialtyId,
            ])
            ->assertRedirect('/doctors/'.$doctor->id.'/slots?date=2026-10-07&specialty_id='.$specialtyId)
            ->assertSessionHas('toast');

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'specialty_id' => $specialtyId,
            'starts_at' => '2026-10-07 09:20:00',
            'ends_at' => '2026-10-07 09:40:00',
        ]);
        $this->assertDatabaseHas('doctor_patient', ['doctor_id' => $doctor->id, 'patient_id' => $patient->id]);
    }

    public function test_super_admin_can_assign(): void
    {
        [$doctor, $specialtyId] = $this->doctorWithWindow();
        $patient = $this->makePatient();

        $this->actingAs($this->makeSuperAdmin())
            ->post('/admin/doctors/'.$doctor->id.'/appointments', [
                'starts_at' => '2026-10-07 09:00:00',
                'patient_id' => $patient->id,
                'specialty_id' => $specialtyId,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', ['doctor_id' => $doctor->id, 'patient_id' => $patient->id]);
    }

    public function test_taken_slot_or_foreign_specialty_is_rejected(): void
    {
        $admin = $this->makeAdmin();
        [$doctor, $specialtyId] = $this->doctorWithWindow();
        $patient = $this->makePatient();
        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 09:20:00',
        ]);
        $foreign = Specialty::query()->whereNotIn('id', $doctor->specialties()->pluck('specialties.id'))->firstOrFail();

        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctor->id.'/appointments', [
                'starts_at' => '2026-10-07 09:00:00',
                'patient_id' => $patient->id,
                'specialty_id' => $specialtyId,
            ])
            ->assertSessionHasErrors('starts_at');

        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctor->id.'/appointments', [
                'starts_at' => '2026-10-07 09:20:00',
                'patient_id' => $patient->id,
                'specialty_id' => $foreign->id,
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_patient_and_doctor_cannot_use_staff_assign(): void
    {
        [$doctor, $specialtyId] = $this->doctorWithWindow();
        $patient = $this->makePatient();
        $payload = [
            'starts_at' => '2026-10-07 09:00:00',
            'patient_id' => $patient->id,
            'specialty_id' => $specialtyId,
        ];

        $this->actingAs($patient->user)->post('/admin/doctors/'.$doctor->id.'/appointments', $payload);
        $this->actingAs($doctor->user)->post('/admin/doctors/'.$doctor->id.'/appointments', $payload);

        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_slots_page_lists_patients_only_for_staff(): void
    {
        [$doctor] = $this->doctorWithWindow();
        $patient = $this->makePatient();

        $this->actingAs($this->makeAdmin())
            ->get('/doctors/'.$doctor->id.'/slots')
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.id', $patient->id)
                ->where('patients.0.dni', $patient->dni));

        $this->actingAs($patient->user)
            ->get('/doctors/'.$doctor->id.'/slots')
            ->assertInertia(fn ($page) => $page->missing('patients'));
    }

    /**
     * @return array{0: Doctor, 1: int}
     */
    private function doctorWithWindow(): array
    {
        $doctor = $this->makeDoctor();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => '2026-10-07 09:00:00',
            'ends_at' => '2026-10-07 10:00:00',
        ]);

        return [$doctor, (int) $doctor->specialties()->value('specialties.id')];
    }
}
