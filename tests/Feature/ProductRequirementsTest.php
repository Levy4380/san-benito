<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Support\RoleRedirector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ProductRequirementsTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_1_public_registration_creates_user_patient_and_patient_role(): void
    {
        $response = $this->post('/register', [
            'name' => 'Nora Paciente',
            'email' => 'nora@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '40111222',
            'birth_date' => '1995-04-10',
            'phone' => '1144445555',
        ]);

        $response->assertRedirect('/paciente');
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'nora@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('patient'));
        $this->assertNotNull($user->patient);
        $this->assertSame('40111222', $user->patient->dni);
        $this->assertSame('Nora Paciente', $user->patient->name);
        $this->assertSame('nora@example.com', $user->patient->email);
        $this->assertSame('1144445555', $user->patient->phone);
    }

    public function test_2_patient_filters_professionals_and_lists_all_with_default_todas(): void
    {
        $patient = $this->makePatient();
        $specialty = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $this->makeProfessional(['name' => 'Ana Pérez'], ['specialty_id' => $specialty->id]);
        $this->makeProfessional(['name' => 'Luis Gómez']);
        $this->makeProfessional(['name' => 'Sin Especialidad'], ['specialty_ids' => []]);

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Index')
                ->has('professionals', 2)
                ->where('filters.specialty_id', 'all')
                ->where('filters.q', '')
                ->where('professionals.0.user.name', 'Ana Pérez')
                ->where('professionals.1.user.name', 'Luis Gómez'));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?specialty_id='.$specialty->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 1));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 1));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?q=Sin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 0));

        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $pedia = Specialty::query()->where('name', 'Pediatría')->firstOrFail();
        $this->makeProfessional(['name' => 'Ana Dual'], ['specialty_ids' => [$specialty->id, $derm->id]]);

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?specialty_id='.$specialty->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 2)
                ->where('professionals.0.user.name', 'Ana Pérez')
                ->where('professionals.1.user.name', 'Ana Dual'));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?specialty_id='.$derm->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 1)
                ->where('professionals.0.user.name', 'Ana Dual'));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales?specialty_id='.$pedia->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('professionals', 0));
    }

    public function test_professionals_belong_to_specialties_via_pivot_not_foreign_key(): void
    {
        $this->assertTrue(Schema::hasTable('professional_specialty'));
        $this->assertTrue(Schema::hasColumns('professional_specialty', ['id', 'professional_id', 'specialty_id', 'created_at', 'updated_at']));
        $this->assertFalse(Schema::hasColumn('professionals', 'specialty_id'));
        $this->assertTrue(Schema::hasColumn('appointments', 'specialty_id'));
        $this->assertFalse(Schema::hasColumn('availability_windows', 'specialty_id'));
    }

    public function test_3_patient_sees_calculated_future_slots(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();

        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales/'.$professional->id.'/horarios?date='.$start->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Slots')
                ->has('slots', 1)
                ->where('slots.0.starts_at', $start->format('Y-m-d H:i:s')));
    }

    public function test_4_successful_booking_inserts_appointment_and_pivot(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $other = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'specialty_id' => $other->id,
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->assertDatabaseCount('appointments', 0);

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start))
            ->assertRedirect('/paciente/mis-turnos')
            ->assertSessionHas('toast', function (array $toast) use ($start): bool {
                return ($toast['variant'] ?? null) === 'ok'
                    && $toast['message'] === 'Reservaste el turno. '.$start->format('Y-m-d').' · '.$start->format('H:i');
            });

        $this->assertDatabaseCount('appointments', 1);
        $this->assertDatabaseHas('appointments', [
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'specialty_id' => $this->specialtyIdOf($professional),
            'starts_at' => $start->format('Y-m-d H:i:s'),
        ]);
        $this->assertDatabaseHas('professional_patient', [
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_5_second_booking_of_same_starts_at_overflows_to_next_slot(): void
    {
        $patientA = $this->makePatient();
        $patientB = $this->makePatient();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $professional = $this->makeProfessional(['name' => 'Ana Dual'], ['specialty_ids' => [$cardio->id, $derm->id]]);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->assertTrue(
            collect(Schema::getIndexes('appointments'))->contains(
                fn (array $index): bool => ($index['unique'] ?? false)
                    && ($index['columns'] ?? []) === ['professional_id', 'starts_at']
            )
        );

        $this->actingAs($patientA->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start, $cardio->id))
            ->assertRedirect('/paciente/mis-turnos');

        $overflow = $start->copy()->addMinutes(20);

        $this->actingAs($patientB->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start, $derm->id))
            ->assertRedirect('/paciente/mis-turnos')
            ->assertSessionHas('toast', function (array $toast) use ($overflow): bool {
                return ($toast['variant'] ?? null) === 'ok'
                    && $toast['message'] === 'Reservaste el turno. '.$overflow->format('Y-m-d').' · '.$overflow->format('H:i');
            });

        $this->assertDatabaseCount('appointments', 2);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patientA->id,
            'specialty_id' => $cardio->id,
            'starts_at' => $start->format('Y-m-d H:i:s'),
        ]);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patientB->id,
            'specialty_id' => $derm->id,
            'starts_at' => $overflow->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_patient_skip_later_slot_of_same_day_is_unavailable(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHours(2),
        ]);
        $afternoon = $start->copy()->setTime(14, 0, 0);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $afternoon,
            'ends_at' => $afternoon->copy()->addHours(2),
        ]);

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start->copy()->addMinutes(40)))
            ->assertSessionHasErrors(['starts_at' => 'El turno ya no está disponible']);

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $afternoon))
            ->assertSessionHasErrors(['starts_at' => 'El turno ya no está disponible']);

        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_patient_race_overflows_to_next_window_same_day(): void
    {
        $patientA = $this->makePatient();
        $patientB = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(20),
        ]);
        $afternoon = $start->copy()->setTime(14, 0, 0);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $afternoon,
            'ends_at' => $afternoon->copy()->addHours(2),
        ]);

        $this->actingAs($patientA->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start))
            ->assertRedirect('/paciente/mis-turnos');

        $this->actingAs($patientB->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start))
            ->assertRedirect('/paciente/mis-turnos');

        $this->assertDatabaseCount('appointments', 2);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patientA->id,
            'starts_at' => $start->format('Y-m-d H:i:s'),
        ]);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patientB->id,
            'starts_at' => $afternoon->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_patient_booking_does_not_spill_to_next_day(): void
    {
        $patientA = $this->makePatient();
        $patientB = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();
        $nextDay = $start->copy()->addDay();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(20),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $nextDay,
            'ends_at' => $nextDay->copy()->addHour(),
        ]);

        $this->actingAs($patientA->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start))
            ->assertRedirect('/paciente/mis-turnos');

        $this->actingAs($patientB->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start))
            ->assertSessionHasErrors(['starts_at' => 'El turno ya no está disponible']);

        $this->assertDatabaseCount('appointments', 1);
        $this->assertDatabaseMissing('appointments', [
            'starts_at' => $nextDay->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_patient_offer_is_one_slot_per_civil_day(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();
        $afternoon = $start->copy()->setTime(14, 0, 0);
        $nextDay = $start->copy()->addDay();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHours(2),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $afternoon,
            'ends_at' => $afternoon->copy()->addHours(2),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $nextDay,
            'ends_at' => $nextDay->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$this->specialtyIdOf($professional).'&professional_id='.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Patient/Book')
                ->has('slots', 2)
                ->where('slots.0.starts_at', $start->format('Y-m-d H:i:s'))
                ->where('slots.1.starts_at', $nextDay->format('Y-m-d H:i:s')));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$this->specialtyIdOf($professional).'&professional_id='.$professional->id.'&date='.$start->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('slots', 1)
                ->where('slots.0.starts_at', $start->format('Y-m-d H:i:s')));

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales/'.$professional->id.'/horarios?date='.$start->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('slots', 1)
                ->where('slots.0.starts_at', $start->format('Y-m-d H:i:s')));

        $this->actingAs($professional->user)
            ->getJson('/agenda/assign-options?date='.$start->toDateString())
            ->assertOk()
            ->assertJsonCount(12, 'slots')
            ->assertJsonPath('slots.0.starts_at', $start->format('Y-m-d H:i:s'))
            ->assertJsonPath('slots.6.starts_at', $afternoon->format('Y-m-d H:i:s'));

        $linked = $this->makePatient();
        $professional->patients()->syncWithoutDetaching([$linked->id]);

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $afternoon->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $this->specialtyIdOf($professional),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', [
            'professional_id' => $professional->id,
            'patient_id' => $linked->id,
            'starts_at' => $afternoon->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_6_patient_cannot_book_past_or_non_slot(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, now()->subHour()))
            ->assertSessionHasErrors('starts_at');

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start->copy()->addMinutes(10)))
            ->assertSessionHasErrors('starts_at');

        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_7_cancellation_deletes_reservation_keeps_window_and_pivot(): void
    {
        [$patient, $professional, $start, $appointment] = $this->bookedSetup();
        $windowId = AvailabilityWindow::query()->first()->id;

        $this->actingAs($patient->user)
            ->delete('/appointments/'.$appointment->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('appointments', ['id' => $appointment->id]);
        $this->assertDatabaseHas('availability_windows', ['id' => $windowId]);
        $this->assertDatabaseHas('professional_patient', [
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/profesionales/'.$professional->id.'/horarios?date='.$start->toDateString())
            ->assertInertia(fn ($page) => $page->has('slots', 1));
    }

    public function test_8_patient_cannot_cancel_someone_elses_appointment(): void
    {
        [, , , $appointment] = $this->bookedSetup();
        $other = $this->makePatient();

        $this->actingAs($other->user)
            ->delete('/appointments/'.$appointment->id)
            ->assertRedirect('/paciente');

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_9_professional_sees_only_own_agenda_and_cannot_create_windows_for_another(): void
    {
        $professionalA = $this->makeProfessional();
        $professionalB = $this->makeProfessional();
        $start = $this->nextWeekdayNine();

        AvailabilityWindow::factory()->create([
            'professional_id' => $professionalB->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($professionalA->user)
            ->get('/profesional/agenda?date='.$start->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('windows', 0));

        $this->actingAs($professionalA->user)
            ->post('/professionals/'.$professionalB->id.'/windows', [
                'starts_at' => $start->copy()->addHours(4)->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect('/profesional');
    }

    public function test_10_windows_reject_invalid_ranges_and_overlaps(): void
    {
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();

        $this->actingAs($professional->user)
            ->post('/agenda/windows', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => [$start->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '09:00']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors();

        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => [$start->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '09:10']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors();

        $this->actingAs($professional->user)
            ->post('/agenda/windows', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors();
    }

    public function test_11_window_with_overlapping_reservation_cannot_be_deleted(): void
    {
        [$patient, $professional, $start, $appointment] = $this->bookedSetup();
        $window = AvailabilityWindow::query()->first();

        $this->actingAs($professional->user)
            ->delete('/agenda/windows/'.$window->id)
            ->assertSessionHasErrors('window');

        $this->assertDatabaseHas('availability_windows', ['id' => $window->id]);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);

        $this->actingAs($professional->user)
            ->delete('/agenda/windows/'.$window->id)
            ->assertSessionHasErrors();

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_12_admin_lists_and_filters_all_reservations(): void
    {
        [$patient, $professional, $start, $appointment] = $this->bookedSetup();
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->get('/admin/reservas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Appointments')
                ->has('appointments.data', 1));

        $this->actingAs($admin)
            ->get('/admin/reservas?professional_id='.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('appointments.data', 1));

        $this->actingAs($admin)
            ->get('/admin/reservas?date='.$start->copy()->addYear()->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('appointments.data', 0));

        $this->actingAs($admin)
            ->get('/admin/reservas?specialty_id='.$appointment->specialty_id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('appointments.data', 1));

        $other = Specialty::factory()->create(['name' => 'Oftalmología']);

        $this->actingAs($admin)
            ->get('/admin/reservas?specialty_id='.$other->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('appointments.data', 0));
    }

    public function test_13_admin_routes_forbidden_for_patient_and_professional_users_forbidden_for_admin(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->firstOrFail();

        foreach ([$patient->user, $professional->user] as $user) {
            $this->actingAs($user)->get('/admin/reservas')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/profesionales')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/professionals/create')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/pacientes')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/patients/create')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/administradores')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/administradores/crear')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/especialidades')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/especialidades/crear')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->get('/admin/configuracion/especialidades/'.$specialty->id.'/editar')->assertRedirect(RoleRedirector::landing($user));
        }

        $this->actingAs($admin)->get('/admin/pacientes')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/patients/create')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/administradores')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/administradores/crear')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/configuracion')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/configuracion/especialidades')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/configuracion/especialidades/crear')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/configuracion/especialidades/'.$specialty->id.'/editar')->assertRedirect('/admin');
    }

    public function test_14_admin_creates_professional_user_entity_and_role(): void
    {
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->firstOrFail();

        $this->actingAs($admin)
            ->getJson('/professionals/create')
            ->assertOk()
            ->assertJsonStructure(['specialties', 'healthInsurances']);

        $this->actingAs($admin)
            ->post('/professionals', [
                'name' => 'Carla Ruiz',
                'email' => 'carla@example.com',
                'password' => 'password',
                'license_number' => 'MN-88888',
                'specialty_ids' => [$specialty->id],
            ])
            ->assertRedirect('/admin/profesionales');

        $user = User::query()->where('email', 'carla@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('professional'));
        $this->assertNotNull($user->professional);
        $this->assertSame('MN-88888', $user->professional->license_number);
        $this->assertDatabaseCount('professional_specialty', 1);
        $this->assertDatabaseHas('professional_specialty', [
            'professional_id' => $user->professional->id,
            'specialty_id' => $specialty->id,
        ]);
    }

    public function test_14_admin_creates_professional_with_multiple_specialties_and_rejects_empty_or_scalar(): void
    {
        $admin = $this->makeAdmin();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();

        $this->actingAs($admin)
            ->post('/professionals', [
                'name' => 'Ana Dual',
                'email' => 'ana.dual@example.com',
                'password' => 'password',
                'license_number' => 'MN-88887',
                'specialty_ids' => [$cardio->id, $derm->id],
            ])
            ->assertRedirect();

        $professional = User::query()->where('email', 'ana.dual@example.com')->first()?->professional;
        $this->assertNotNull($professional);
        $this->assertDatabaseCount('professional_specialty', 2);
        $this->assertEqualsCanonicalizing(
            [$cardio->id, $derm->id],
            $professional->specialties()->pluck('specialties.id')->all(),
        );

        $this->actingAs($admin)
            ->from('/professionals/create')
            ->post('/professionals', [
                'name' => 'Sin Especialidad',
                'email' => 'sin.esp@example.com',
                'password' => 'password',
                'license_number' => 'MN-88886',
                'specialty_ids' => [],
            ])
            ->assertSessionHasErrors('specialty_ids');

        $this->actingAs($admin)
            ->from('/professionals/create')
            ->post('/professionals', [
                'name' => 'Escalar Solo',
                'email' => 'escalar@example.com',
                'password' => 'password',
                'license_number' => 'MN-88885',
                'specialty_id' => $cardio->id,
            ])
            ->assertSessionHasErrors('specialty_ids');

        $this->assertNull(User::query()->where('email', 'sin.esp@example.com')->first());
        $this->assertNull(User::query()->where('email', 'escalar@example.com')->first());
    }

    public function test_15_manual_link_professional_self_only_admin_any_duplicate_idempotent(): void
    {
        $professionalA = $this->makeProfessional();
        $professionalB = $this->makeProfessional();
        $patient = $this->makePatient();
        $admin = $this->makeAdmin();

        $this->actingAs($professionalA->user)
            ->post('/my-patients', ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseCount('professional_patient', 1);

        $this->actingAs($professionalA->user)
            ->post('/my-patients', ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseCount('professional_patient', 1);

        $this->actingAs($professionalB->user)
            ->post('/professionals/'.$professionalA->id.'/patients', ['patient_id' => $patient->id])
            ->assertRedirect('/profesional');

        $this->actingAs($admin)
            ->post('/professionals/'.$professionalB->id.'/patients', ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseCount('professional_patient', 2);
    }

    public function test_16_professional_sees_only_own_patients_and_can_search(): void
    {
        $professional = $this->makeProfessional();
        $own = $this->makePatient(['name' => 'Marta Propia'], ['dni' => '33999888']);
        $other = $this->makePatient(['name' => 'Otro Paciente', 'email' => 'otro.unico@example.com']);
        $professional->patients()->syncWithoutDetaching([$own->id]);

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('patients', 1));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?q=3399')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('candidates', 1)->has('patients', 1));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?q=Ot')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('candidates', 1)->has('patients', 1));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes?q=otro.unico')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('candidates', 1)
                ->where('candidates.0.user.email', 'otro.unico@example.com')
                ->has('patients', 1)
                ->where('patients.0.id', $own->id));
    }

    public function test_17_post_login_and_register_go_to_portal_homes(): void
    {
        $patient = $this->makePatient(['email' => 'p@example.com']);
        $professional = $this->makeProfessional(['email' => 'd@example.com']);
        $admin = $this->makeAdmin(['email' => 'a@example.com']);

        $this->post('/login', ['email' => 'p@example.com', 'password' => 'password'])
            ->assertRedirect('/paciente');

        $this->post('/logout');

        $this->post('/login', ['email' => 'd@example.com', 'password' => 'password'])
            ->assertRedirect('/profesional');

        $this->post('/logout');

        $this->post('/login', ['email' => 'a@example.com', 'password' => 'password'])
            ->assertRedirect('/admin');

        $this->post('/logout');

        $super = $this->makeSuperAdmin(['email' => 's@example.com']);
        $this->post('/login', ['email' => 's@example.com', 'password' => 'password'])
            ->assertRedirect('/admin');

        $this->actingAs($admin)->get('/home')->assertRedirect('/admin');
        $this->actingAs($super)->get('/home')->assertRedirect('/admin');
        $this->actingAs($patient->user)->get('/home')->assertRedirect('/paciente');
        $this->actingAs($professional->user)->get('/home')->assertRedirect('/profesional');
        $this->actingAs($patient->user)->get('/paciente')->assertInertia(fn ($page) => $page->component('Patient/Home'));
        $this->actingAs($professional->user)->get('/profesional')->assertInertia(fn ($page) => $page->component('Professional/Home'));
        $this->actingAs($patient->user)->get('/profesional')->assertRedirect('/paciente');
    }

    public function test_17_program_routes_stay_in_own_or_any_family(): void
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();
        $super = $this->makeSuperAdmin();
        $start = $this->nextWeekdayNine();

        $this->actingAs($professional->user)
            ->get('/profesional/programar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Professional/Program'));

        foreach ([$patient->user, $admin, $super] as $user) {
            $this->actingAs($user)->get('/profesional/programar')->assertRedirect(RoleRedirector::landing($user));
        }

        $payload = [
            'dates' => [$start->toDateString()],
            'ranges' => [['start' => '11:00', 'end' => '12:00']],
            'block_weekends' => false,
        ];

        $this->actingAs($professional->user)
            ->post('/professionals/'.$professional->id.'/windows/program', $payload)
            ->assertRedirect('/profesional');

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/windows/program', $payload)
            ->assertRedirect('/paciente');

        $this->actingAs($admin)
            ->post('/professionals/'.$professional->id.'/windows/program', $payload)
            ->assertRedirect();

        $this->actingAs($super)
            ->post('/professionals/'.$professional->id.'/windows/program', [
                'dates' => [$start->copy()->addDay()->toDateString()],
                'ranges' => [['start' => '11:00', 'end' => '12:00']],
                'block_weekends' => false,
            ])
            ->assertRedirect();
    }

    public function test_18_wizard_specialty_filters_professionals_and_booking_inserts(): void
    {
        $patient = $this->makePatient();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $professional = $this->makeProfessional(['name' => 'Ana Pérez'], ['specialty_ids' => [$cardio->id, $derm->id]]);
        $other = Specialty::query()->where('name', 'Pediatría')->firstOrFail();
        $this->makeProfessional(['name' => 'Otro'], ['specialty_id' => $other->id]);
        $empty = Specialty::factory()->create(['name' => 'Oftalmología']);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.coverage', 'particular')
                ->where('nearest_professional_id', null)
                ->where('specialties', function ($specialties) use ($cardio, $empty): bool {
                    $ids = collect($specialties)->pluck('id')->all();

                    return in_array($cardio->id, $ids, true)
                        && ! in_array($empty->id, $ids, true);
                }));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 1)
                ->where('professionals.0.user.name', 'Ana Pérez')
                ->where('filters.professional_id', null)
                ->where('nearest_professional_id', $professional->id));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id.'&professional_id='.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.specialty_id', $cardio->id)
                ->where('filters.professional_id', $professional->id));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 1)
                ->where('filters.professional_id', null));

        $this->actingAs($patient->user)
            ->get('/paciente/reserva')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.coverage', null)
                ->where('filters.specialty_id', null)
                ->where('filters.professional_id', null)
                ->has('professionals', 0));

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start, $cardio->id))
            ->assertRedirect('/paciente/mis-turnos');

        $this->assertDatabaseCount('appointments', 1);
        $this->assertTrue(Schema::hasColumn('appointments', 'specialty_id'));
        $this->assertDatabaseHas('appointments', [
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'specialty_id' => $cardio->id,
        ]);
        $this->assertDatabaseMissing('appointments', [
            'specialty_id' => $derm->id,
        ]);
        $this->assertDatabaseHas('professional_patient', [
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_18_wizard_professional_step_marks_nearest_available_slot(): void
    {
        $patient = $this->makePatient();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $later = $this->makeProfessional(['name' => 'Ana Pérez'], ['specialty_id' => $cardio->id]);
        $sooner = $this->makeProfessional(['name' => 'Luis Gómez'], ['specialty_id' => $cardio->id]);
        $this->makeProfessional(['name' => 'Sin Agenda'], ['specialty_id' => $cardio->id]);

        $soon = $this->nextWeekdayNine();
        $late = $soon->copy()->addDay();

        AvailabilityWindow::factory()->create([
            'professional_id' => $later->id,
            'starts_at' => $late,
            'ends_at' => $late->copy()->addMinutes($later->slot_duration_minutes),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $sooner->id,
            'starts_at' => $soon,
            'ends_at' => $soon->copy()->addMinutes($sooner->slot_duration_minutes),
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 2)
                ->where('nearest_professional_id', $sooner->id)
                ->where('professionals.0.id', $sooner->id)
                ->where('professionals.0.user.name', 'Luis Gómez')
                ->where('professionals', function ($professionals): bool {
                    return collect($professionals)->pluck('user.name')->doesntContain('Sin Agenda');
                }));

        $this->actingAs($patient->user)
            ->post('/professionals/'.$sooner->id.'/appointments', $this->reservationPayload($sooner, $soon, $cardio->id))
            ->assertRedirect('/paciente/mis-turnos');

        $this->actingAs($patient->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('professionals', 1)
                ->where('nearest_professional_id', $later->id)
                ->where('professionals.0.id', $later->id));
    }

    public function test_19_program_persists_n_by_m_windows_and_zero_appointments(): void
    {
        $professional = $this->makeProfessional();
        $wednesday = now()->next(Carbon::WEDNESDAY);
        $thursday = $wednesday->copy()->addDay();
        $saturday = $wednesday->copy()->next(Carbon::SATURDAY);

        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => [$wednesday->toDateString(), $thursday->toDateString()],
                'ranges' => [
                    ['start' => '09:00', 'end' => '10:00'],
                    ['start' => '14:00', 'end' => '15:00'],
                ],
                'block_weekends' => false,
            ])
            ->assertRedirect('/profesional/agenda');

        $this->assertDatabaseCount('availability_windows', 4);
        $this->assertDatabaseCount('appointments', 0);

        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => [$saturday->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '10:00']],
                'block_weekends' => true,
            ])
            ->assertSessionHasErrors('dates');

        $this->assertDatabaseCount('availability_windows', 4);

        $overlapDay = $wednesday->toDateString();
        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => [$overlapDay],
                'ranges' => [['start' => '09:30', 'end' => '10:30']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors();

        $this->assertDatabaseCount('availability_windows', 4);

        $slots = app(AvailabilityService::class)
            ->calculateSlots($professional, $wednesday->copy()->startOfDay(), $wednesday->copy()->endOfDay());

        $this->assertCount(6, $slots);
    }

    public function test_20_assign_inserts_on_calculated_slot_and_rejects_unlinked(): void
    {
        $professional = $this->makeProfessional();
        $linked = $this->makePatient();
        $unlinked = $this->makePatient();
        $professional->patients()->syncWithoutDetaching([$linked->id]);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($professional->user)
            ->getJson('/agenda/assign-options?date='.$start->toDateString())
            ->assertOk()
            ->assertJsonCount(3, 'slots');

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $unlinked->id,
                'specialty_id' => $this->specialtyIdOf($professional),
            ])
            ->assertSessionHasErrors('patient_id');

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
            ])
            ->assertSessionHasErrors('specialty_id');

        $later = $start->copy()->addMinutes(40);

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $later->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $this->specialtyIdOf($professional),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', [
            'professional_id' => $professional->id,
            'patient_id' => $linked->id,
            'starts_at' => $later->format('Y-m-d H:i:s'),
        ]);

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $this->specialtyIdOf($professional),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('appointments', 2);
        $this->assertDatabaseHas('appointments', [
            'professional_id' => $professional->id,
            'patient_id' => $linked->id,
            'specialty_id' => $this->specialtyIdOf($professional),
            'starts_at' => $start->format('Y-m-d H:i:s'),
        ]);

        $other = Specialty::query()->where('name', 'Dermatología')->firstOrFail();

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $other->id,
            ])
            ->assertSessionHasErrors();

        $this->actingAs($professional->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $this->specialtyIdOf($professional),
            ])
            ->assertSessionHasErrors('starts_at');

        $this->assertDatabaseCount('appointments', 2);
    }

    public function test_21_profiles_patient_sees_professional_professional_sees_linked_patient(): void
    {
        $professional = $this->makeProfessional();
        $linked = $this->makePatient();
        $other = $this->makePatient();
        $professional->patients()->syncWithoutDetaching([$linked->id]);

        $this->actingAs($linked->user)
            ->get('/paciente/profesionales/'.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Professionals/Show'));

        $this->actingAs($this->makeAdmin())
            ->get('/paciente/profesionales/'.$professional->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Professionals/Show'));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes/'.$linked->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Professional/PatientProfile'));

        $this->actingAs($professional->user)
            ->get('/profesional/mis-pacientes/'.$other->id)
            ->assertRedirect('/profesional');
    }

    public function test_22_admin_can_persist_windows_for_another_professional(): void
    {
        $admin = $this->makeAdmin();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();

        $this->actingAs($admin)
            ->post('/professionals/'.$professional->id.'/windows', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('availability_windows', 1);
        $this->assertDatabaseHas('availability_windows', ['professional_id' => $professional->id]);

        $thursday = $start->copy()->next(Carbon::THURSDAY);
        $this->actingAs($admin)
            ->post('/professionals/'.$professional->id.'/windows/program', [
                'dates' => [$thursday->toDateString()],
                'ranges' => [['start' => '11:00', 'end' => '12:00']],
                'block_weekends' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('availability_windows', 2);
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_23_patient_sees_upcoming_on_my_appointments_and_past_on_history(): void
    {
        $patient = $this->makePatient();
        $other = $this->makePatient();
        $professional = $this->makeProfessional();
        $past = now()->subDay()->setTime(10, 0, 0);
        $future = $this->nextWeekdayNine();

        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => $past,
            'ends_at' => $past->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $patient->id,
            'starts_at' => $future,
            'ends_at' => $future->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'patient_id' => $other->id,
            'starts_at' => $past->copy()->subDay(),
            'ends_at' => $past->copy()->subDay()->addMinutes(20),
        ]);

        $this->actingAs($patient->user)
            ->get('/paciente/mis-turnos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/Index')
                ->has('appointments', 1)
                ->where('appointments.0.starts_at', $future->format('Y-m-d H:i:s'))
                ->where('appointments.0.specialty.id', $this->specialtyIdOf($professional))
                ->where('today', now()->toDateString())
                ->where('now', now()->format('Y-m-d H:i:s')));

        $this->actingAs($patient->user)
            ->get('/paciente/mis-turnos/historial')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/History')
                ->has('appointments', 1)
                ->where('appointments.0.starts_at', $past->format('Y-m-d H:i:s')));

        $this->actingAs($this->makeProfessional()->user)
            ->get('/paciente/mis-turnos/historial')
            ->assertRedirect('/profesional');
    }

    public function test_get_urls_choose_create_associate_and_agenda_panel_screens(): void
    {
        $admin = $this->makeAdmin();
        $super = $this->makeSuperAdmin();
        $professional = $this->makeProfessional();
        $linked = $this->makePatient();
        $professional->patients()->syncWithoutDetaching([$linked->id]);
        $date = $this->nextWeekdayNine()->toDateString();

        $this->actingAs($admin)
            ->get('/admin/profesionales')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Professionals'))
            ->assertDontSee('Matrícula');

        $this->actingAs($admin)->get('/admin/administradores/crear')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/patients/create')->assertRedirect('/admin');

        $this->actingAs($super)
            ->get('/admin/administradores/crear')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/AdminCreate'));

        $this->actingAs($super)
            ->getJson('/patients/create')
            ->assertOk()
            ->assertJsonStructure(['healthInsurances']);

        $this->actingAs($this->makePatient()->user)
            ->get('/admin/profesionales/'.$professional->id.'/especialidades')
            ->assertRedirect('/paciente');

        $this->actingAs($admin)
            ->get('/admin/profesionales/'.$professional->id.'/especialidades')
            ->assertRedirect('/admin');

        $this->actingAs($super)
            ->get('/admin/profesionales/'.$professional->id.'/especialidades')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professionals/Specialties')
                ->where('professional.id', $professional->id)
                ->has('specialties'));

        $this->actingAs($professional->user)
            ->get('/profesional/agenda?panel=load&date='.$date)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Professional/Agenda')
                ->where('panel', 'load')
                ->where('selectedDate', $date));

        $this->actingAs($professional->user)
            ->get('/profesional/agenda?patient_id='.$linked->id.'&panel=assign')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('panel', 'day')
                ->missing('preselectedPatient')
                ->missing('patients'));

        $this->actingAs($professional->user)
            ->get('/profesional/agenda?date='.$date)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('panel', 'day'));

        $this->actingAs($this->makePatient()->user)
            ->get('/paciente/reserva?coverage=particular&specialty_id='.Specialty::query()->firstOrFail()->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Patient/Book'));

        $this->actingAs($this->makePatient()->user)->get('/paciente/reserva/specialty')->assertNotFound();
        $this->actingAs($professional->user)->get('/profesional/programar')->assertOk();
        $this->actingAs($professional->user)->get('/profesional/programar/hours')->assertNotFound();
    }

    /**
     * @return array{0: Patient, 1: Professional, 2: Carbon, 3: Appointment}
     */
    private function bookedSetup(): array
    {
        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->post('/professionals/'.$professional->id.'/appointments', $this->reservationPayload($professional, $start));

        $appointment = Appointment::query()->firstOrFail();

        return [$patient, $professional, $start, $appointment];
    }

    /**
     * @return array{starts_at: string, specialty_id: int}
     */
    private function reservationPayload(Professional $professional, Carbon $start, ?int $specialtyId = null): array
    {
        return [
            'starts_at' => $start->format('Y-m-d H:i:s'),
            'specialty_id' => $specialtyId ?? $this->specialtyIdOf($professional),
        ];
    }

    private function specialtyIdOf(Professional $professional): int
    {
        $id = $professional->specialties->first()?->id;

        $this->assertNotNull($id);

        return (int) $id;
    }

    private function nextWeekdayNine(): Carbon
    {
        return now()->next(Carbon::WEDNESDAY)->setTime(9, 0, 0);
    }
}
