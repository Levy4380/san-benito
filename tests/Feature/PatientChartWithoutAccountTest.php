<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class PatientChartWithoutAccountTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_super_admin_creates_a_chart_without_a_user_and_it_can_be_listed_and_linked(): void
    {
        $super = $this->makeSuperAdmin();
        $doctor = $this->makeDoctor();
        $usersBefore = User::query()->count();
        $rolesBefore = DB::table('model_has_roles')->count();

        $this->actingAs($super)
            ->post('/admin/patients', [
                'with_account' => false,
                'name' => 'Nora Sin Cuenta',
                'email' => 'nora.sin@example.com',
                'password' => 'password',
                'dni' => '50111222',
                'birth_date' => '1992-03-04',
                'phone' => '1199990000',
                'health_insurance_id' => '',
            ])
            ->assertRedirect('/admin/patients')
            ->assertSessionHas('toast.message', 'Creaste el paciente.');

        $this->assertAuthenticatedAs($super);
        $this->assertSame($usersBefore, User::query()->count());
        $this->assertSame($rolesBefore, DB::table('model_has_roles')->count());
        $this->assertNull(User::query()->where('email', 'nora.sin@example.com')->first());

        $chart = Patient::query()->where('email', 'nora.sin@example.com')->first();
        $this->assertNotNull($chart);
        $this->assertNull($chart->user_id);
        $this->assertSame('Nora Sin Cuenta', $chart->name);
        $this->assertSame('50111222', $chart->dni);
        $this->assertSame(0, $chart->healthInsurances()->count());

        $this->actingAs($super)
            ->get('/admin/patients')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Patients')
                ->has('patients', 1)
                ->where('patients.0.name', 'Nora Sin Cuenta')
                ->where('patients.0.email', 'nora.sin@example.com')
                ->where('patients.0.dni', '50111222')
                ->where('patients.0.user', null));

        $this->actingAs($super)
            ->get('/admin/patients?q=nora.sin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('patients', 1)->where('patients.0.id', $chart->id));

        $this->actingAs($doctor->user)
            ->get('/my-patients?q=Nora')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('candidates', 1)
                ->where('candidates.0.id', $chart->id)
                ->where('candidates.0.name', 'Nora Sin Cuenta')
                ->where('candidates.0.user', null));

        $this->actingAs($doctor->user)
            ->post('/my-patients', ['patient_id' => $chart->id])
            ->assertRedirect();

        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $chart->id,
        ]);
    }

    public function test_register_attaches_an_unlinked_chart_and_keeps_its_rows(): void
    {
        $osde = HealthInsurance::factory()->create(['name' => 'OSDE']);
        $swiss = HealthInsurance::factory()->create(['name' => 'Swiss Medical']);
        $doctor = $this->makeDoctor();
        $chart = Patient::factory()->withoutUser()->create([
            'name' => 'Ficha Vieja',
            'email' => 'ficha@example.com',
            'phone' => '1100001111',
            'dni' => '30111000',
            'birth_date' => '1988-07-21',
        ]);
        $chart->healthInsurances()->sync([$osde->id]);
        $doctor->patients()->syncWithoutDetaching([$chart->id]);
        $appointment = Appointment::factory()->create([
            'patient_id' => $chart->id,
            'doctor_id' => $doctor->id,
        ]);

        $this->post('/register', [
            'name' => 'Nombre Actual',
            'email' => 'ficha@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '30111000',
            'birth_date' => '1988-07-21',
            'phone' => '1155556666',
            'health_insurance_id' => $swiss->id,
        ])->assertRedirect('/');

        $this->assertAuthenticated();
        $this->assertSame(1, Patient::query()->count());

        $chart->refresh();
        $user = User::query()->where('email', 'ficha@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('patient'));
        $this->assertSame($chart->id, $user->patient->id);
        $this->assertSame($user->id, $chart->user_id);
        $this->assertSame('Nombre Actual', $chart->name);
        $this->assertSame('Nombre Actual', $user->name);
        $this->assertSame('1155556666', $chart->phone);
        $this->assertSame('1155556666', $user->phone);
        $this->assertSame('ficha@example.com', $chart->email);
        $this->assertSame([$osde->id], $chart->healthInsurances()->pluck('health_insurances.id')->all());
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'patient_id' => $chart->id,
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $chart->id,
        ]);
    }

    public function test_register_rejects_an_existing_user_email_without_new_rows(): void
    {
        $this->makeDoctor(['email' => 'doc@example.com']);
        $users = User::query()->count();
        $patients = Patient::query()->count();

        $this->post('/register', [
            'name' => 'Otra Persona',
            'email' => 'doc@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '40111001',
            'birth_date' => '1991-01-01',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertSame($users, User::query()->count());
        $this->assertSame($patients, Patient::query()->count());
    }

    public function test_register_rejects_a_chart_when_dni_or_birth_date_differ_without_writes(): void
    {
        $chart = Patient::factory()->withoutUser()->create([
            'email' => 'ficha@example.com',
            'dni' => '30111000',
            'birth_date' => '1988-07-21',
        ]);
        $users = User::query()->count();
        $patients = Patient::query()->count();

        $this->post('/register', [
            'name' => 'Nombre Actual',
            'email' => 'ficha@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '30999000',
            'birth_date' => '1988-07-21',
        ])->assertSessionHasErrors('dni');

        $this->assertGuest();
        $this->assertSame($users, User::query()->count());
        $this->assertSame($patients, Patient::query()->count());
        $this->assertNull($chart->refresh()->user_id);

        $this->post('/register', [
            'name' => 'Nombre Actual',
            'email' => 'ficha@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '30111000',
            'birth_date' => '1999-01-01',
        ])->assertSessionHasErrors('birth_date');

        $this->assertSame($users, User::query()->count());
        $this->assertSame($patients, Patient::query()->count());
        $this->assertNull($chart->refresh()->user_id);
    }

    public function test_profile_update_syncs_identity_onto_the_patient_chart(): void
    {
        $patient = $this->makePatient([
            'name' => 'Antes',
            'email' => 'antes@example.com',
            'phone' => '1111111111',
        ]);

        $this->actingAs($patient->user)
            ->patch('/settings/profile', [
                'name' => 'Después',
                'email' => 'despues@example.com',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');

        $patient->refresh();
        $patient->user->refresh();
        $this->assertSame('Después', $patient->user->name);
        $this->assertSame('despues@example.com', $patient->user->email);
        $this->assertSame('Después', $patient->name);
        $this->assertSame('despues@example.com', $patient->email);
        $this->assertSame($patient->user->phone, $patient->phone);
    }

    public function test_deleting_the_user_keeps_the_chart_and_its_appointments(): void
    {
        $doctor = $this->makeDoctor();
        $patient = $this->makePatient();
        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        $patient->user->delete();

        $patient->refresh();
        $this->assertNull($patient->user_id);
        $this->assertNotNull(Patient::query()->find($patient->id));
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_factory_without_user_does_not_create_an_account(): void
    {
        $before = User::query()->count();

        $patient = Patient::factory()->withoutUser()->create();

        $this->assertSame($before, User::query()->count());
        $this->assertNull($patient->user_id);
        $this->assertNotSame('', $patient->name);
        $this->assertNotSame('', $patient->email);
    }
}
