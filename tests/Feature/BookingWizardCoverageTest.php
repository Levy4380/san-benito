<?php

namespace Tests\Feature;

use App\Models\AvailabilityWindow;
use App\Models\HealthInsurance;
use App\Models\Specialty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class BookingWizardCoverageTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_patient_without_insurance_only_books_as_particular(): void
    {
        $patient = $this->makePatient();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $professional = $this->makeProfessional(['name' => 'Sin Obra'], ['specialty_id' => $cardio->id]);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/reserva')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Patient/Book')
                ->where('has_health_insurance', false)
                ->where('filters.coverage', null)
                ->has('professionals', 0));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=health_insurance&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.coverage', null)
                ->where('filters.specialty_id', null)
                ->has('professionals', 0));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.coverage', 'particular')
                ->has('professionals', 1)
                ->where('professionals.0.id', $professional->id));
    }

    public function test_health_insurance_coverage_filters_the_wizard_and_not_the_directory(): void
    {
        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $swiss = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $patient = $this->makePatient();
        $patient->healthInsurances()->attach($osde->id);

        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $linked = $this->makeProfessional(['name' => 'Toma OSDE'], ['specialty_id' => $cardio->id]);
        $unlinked = $this->makeProfessional(['name' => 'Particular'], ['specialty_id' => $cardio->id]);
        $other = $this->makeProfessional(['name' => 'Otra Obra'], ['specialty_ids' => [$cardio->id, $derm->id]]);
        $dermOnly = $this->makeProfessional(['name' => 'Solo Derma'], ['specialty_id' => $derm->id]);
        $linked->healthInsurances()->attach($osde->id);
        $other->healthInsurances()->attach($swiss->id);

        $start = $this->nextWeekdayNine();

        foreach ([$linked, $unlinked, $other, $dermOnly] as $professional) {
            AvailabilityWindow::factory()->create([
                'professional_id' => $professional->id,
                'starts_at' => $start,
                'ends_at' => $start->copy()->addHour(),
            ]);
        }

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=health_insurance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('has_health_insurance', true)
                ->where('filters.coverage', 'health_insurance')
                ->where('specialties', function ($specialties) use ($cardio, $derm): bool {
                    $ids = collect($specialties)->pluck('id');

                    return $ids->contains($cardio->id) && ! $ids->contains($derm->id);
                }));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=health_insurance&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 1)
                ->where('professionals.0.id', $linked->id)
                ->where('professionals', function ($professionals) use ($unlinked): bool {
                    return collect($professionals)->pluck('id')->doesntContain($unlinked->id);
                }));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('professionals', function ($professionals) use ($linked, $unlinked): bool {
                    $ids = collect($professionals)->pluck('id');

                    return $ids->contains($linked->id) && $ids->contains($unlinked->id);
                }));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('professionals', function ($professionals) use ($linked, $unlinked): bool {
                    $ids = collect($professionals)->pluck('id');

                    return $ids->contains($linked->id) && $ids->contains($unlinked->id);
                }));

        $this->actingAs($patient->user)
            ->post('/professionals/'.$unlinked->id.'/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'specialty_id' => $cardio->id,
            ])
            ->assertRedirect('/paciente/mis-turnos');

        $this->assertDatabaseHas('appointments', [
            'professional_id' => $unlinked->id,
            'patient_id' => $patient->id,
            'specialty_id' => $cardio->id,
        ]);
    }

    private function nextWeekdayNine(): Carbon
    {
        return now()->next(Carbon::WEDNESDAY)->setTime(9, 0, 0);
    }
}
