<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HealthInsurance;
use App\Models\Specialty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class MyPatientsFiltersTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_professional_filters_linked_patients_by_accepted_insurance_and_own_specialty(): void
    {
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $clinica = Specialty::query()->where('name', 'Clínica Médica')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $professional = $this->makeProfessional([], ['specialty_ids' => [$cardio->id, $clinica->id]]);
        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $swiss = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $other = HealthInsurance::factory()->create(['name' => 'Otra']);
        $professional->healthInsurances()->sync([$osde->id, $swiss->id]);

        $ana = $this->makePatient(['name' => 'Ana Osde']);
        $luis = $this->makePatient(['name' => 'Luis Swiss']);
        $nora = $this->makePatient(['name' => 'Nora Otra']);
        $ana->healthInsurances()->attach($osde);
        $luis->healthInsurances()->attach($swiss);
        $nora->healthInsurances()->attach($other);
        $professional->patients()->sync([$ana->id, $luis->id, $nora->id]);

        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $ana->id,
            'specialty_id' => $cardio->id,
        ]);
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $luis->id,
            'specialty_id' => $clinica->id,
            'starts_at' => now()->addDays(2)->startOfHour(),
            'ends_at' => now()->addDays(2)->startOfHour()->addMinutes(20),
        ]);

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/MyPatients')
                ->has('patients', 3)
                ->has('healthInsurances', 2)
                ->has('specialties', 2)
                ->where('filters.health_insurance_id', 'all')
                ->where('filters.specialty_id', 'all')
                ->where('filters.q', ''));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?health_insurance_id='.$osde->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.name', 'Ana Osde'));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.name', 'Ana Osde'));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?health_insurance_id='.$swiss->id.'&specialty_id='.$clinica->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.name', 'Luis Swiss'));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?health_insurance_id='.$other->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('patients', 0));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?specialty_id='.$derm->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('patients', 0));

        $unlinked = $this->makePatient(['name' => 'Ana Candidata']);
        $unlinked->healthInsurances()->attach($osde);

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?q=Ana&health_insurance_id='.$osde->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->has('candidates', 2));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?q=Ana&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->has('candidates', 1)
                ->where('candidates.0.name', 'Ana Osde'));
    }
}
