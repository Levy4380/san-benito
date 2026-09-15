<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use App\Services\AvailabilityService;
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
            'health_insurance' => 'OSDE',
        ]);

        $response->assertRedirect('/home');
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'nora@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('patient'));
        $this->assertNotNull($user->patient);
        $this->assertSame('40111222', $user->patient->dni);
    }

    public function test_2_patient_filters_doctors_and_lists_all_with_default_todas(): void
    {
        $patient = $this->makePatient();
        $specialty = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $this->makeDoctor(['name' => 'Ana Pérez'], ['specialty_id' => $specialty->id]);
        $this->makeDoctor(['name' => 'Luis Gómez']);

        $this->actingAs($patient->user)
            ->get('/doctors')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Index')
                ->has('doctors', 2)
                ->where('filters.specialty_id', 'all')
                ->where('filters.q', ''));

        $this->actingAs($patient->user)
            ->get('/doctors?specialty_id='.$specialty->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('doctors', 1));

        $this->actingAs($patient->user)
            ->get('/doctors?q=Ana')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('doctors', 1));

        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $pedia = Specialty::query()->where('name', 'Pediatría')->firstOrFail();
        $this->makeDoctor(['name' => 'Ana Dual'], ['specialty_ids' => [$specialty->id, $derm->id]]);

        $this->actingAs($patient->user)
            ->get('/doctors?specialty_id='.$specialty->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('doctors', 2)
                ->where('doctors.0.user.name', 'Ana Pérez')
                ->where('doctors.1.user.name', 'Ana Dual'));

        $this->actingAs($patient->user)
            ->get('/doctors?specialty_id='.$derm->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('doctors', 1)
                ->where('doctors.0.user.name', 'Ana Dual'));

        $this->actingAs($patient->user)
            ->get('/doctors?specialty_id='.$pedia->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('doctors', 0));
    }

    public function test_doctors_belong_to_specialties_via_pivot_not_foreign_key(): void
    {
        $this->assertTrue(Schema::hasTable('doctor_specialty'));
        $this->assertTrue(Schema::hasColumns('doctor_specialty', ['id', 'doctor_id', 'specialty_id', 'created_at', 'updated_at']));
        $this->assertFalse(Schema::hasColumn('doctors', 'specialty_id'));
        $this->assertTrue(Schema::hasColumn('appointments', 'specialty_id'));
        $this->assertFalse(Schema::hasColumn('availability_windows', 'specialty_id'));
    }

    public function test_3_patient_sees_calculated_future_slots(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $start = $this->nextWeekdayNine();

        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->get('/doctors/'.$doctor->id.'/slots?date='.$start->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Doctors/Slots')
                ->has('slots', 3));
    }

    public function test_4_successful_booking_inserts_appointment_and_pivot(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $other = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'specialty_id' => $other->id,
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->assertDatabaseCount('appointments', 0);

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, $start))
            ->assertRedirect('/my-appointments');

        $this->assertDatabaseCount('appointments', 1);
        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'specialty_id' => $this->specialtyIdOf($doctor),
            'starts_at' => $start->format('Y-m-d H:i:s'),
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_5_second_booking_of_same_starts_at_fails(): void
    {
        $patientA = $this->makePatient();
        $patientB = $this->makePatient();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $doctor = $this->makeDoctor(['name' => 'Ana Dual'], ['specialty_ids' => [$cardio->id, $derm->id]]);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patientA->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, $start, $cardio->id))
            ->assertRedirect('/my-appointments');

        $this->actingAs($patientB->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, $start, $derm->id))
            ->assertSessionHasErrors('starts_at');

        $this->assertDatabaseCount('appointments', 1);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patientA->id,
            'specialty_id' => $cardio->id,
        ]);
    }

    public function test_6_patient_cannot_book_past_or_non_slot(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, now()->subHour()))
            ->assertSessionHasErrors('starts_at');

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, $start->copy()->addMinutes(10)))
            ->assertSessionHasErrors('starts_at');

        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_7_cancellation_deletes_reservation_keeps_window_and_pivot(): void
    {
        [$patient, $doctor, $start, $appointment] = $this->bookedSetup();
        $windowId = AvailabilityWindow::query()->first()->id;

        $this->actingAs($patient->user)
            ->delete('/appointments/'.$appointment->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('appointments', ['id' => $appointment->id]);
        $this->assertDatabaseHas('availability_windows', ['id' => $windowId]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        $this->actingAs($patient->user)
            ->get('/doctors/'.$doctor->id.'/slots?date='.$start->toDateString())
            ->assertInertia(fn ($page) => $page->has('slots', 3));
    }

    public function test_8_patient_cannot_cancel_someone_elses_appointment(): void
    {
        [, , , $appointment] = $this->bookedSetup();
        $other = $this->makePatient();

        $this->actingAs($other->user)
            ->delete('/appointments/'.$appointment->id)
            ->assertForbidden();

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_9_doctor_sees_only_own_agenda_and_cannot_create_windows_for_another(): void
    {
        $doctorA = $this->makeDoctor();
        $doctorB = $this->makeDoctor();
        $start = $this->nextWeekdayNine();

        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctorB->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($doctorA->user)
            ->get('/agenda?date='.$start->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('windows', 0));

        $this->actingAs($doctorA->user)
            ->post('/admin/doctors/'.$doctorB->id.'/windows', [
                'starts_at' => $start->copy()->addHours(4)->format('Y-m-d H:i:s'),
            ])
            ->assertForbidden();
    }

    public function test_10_windows_reject_invalid_ranges_and_overlaps(): void
    {
        $doctor = $this->makeDoctor();
        $start = $this->nextWeekdayNine();

        $this->actingAs($doctor->user)
            ->post('/agenda/windows', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->actingAs($doctor->user)
            ->post('/agenda/program', [
                'dates' => [$start->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '09:00']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors();

        $this->actingAs($doctor->user)
            ->post('/agenda/program', [
                'dates' => [$start->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '09:10']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors();

        $this->actingAs($doctor->user)
            ->post('/agenda/windows', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors();
    }

    public function test_11_window_with_overlapping_reservation_cannot_be_deleted(): void
    {
        [$patient, $doctor, $start, $appointment] = $this->bookedSetup();
        $window = AvailabilityWindow::query()->first();

        $this->actingAs($doctor->user)
            ->delete('/agenda/windows/'.$window->id)
            ->assertSessionHasErrors('window');

        $this->assertDatabaseHas('availability_windows', ['id' => $window->id]);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);

        $this->actingAs($doctor->user)
            ->delete('/agenda/windows/'.$window->id)
            ->assertSessionHasErrors();

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_12_admin_lists_and_filters_all_reservations(): void
    {
        [$patient, $doctor, $start, $appointment] = $this->bookedSetup();
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
            ->get('/admin/appointments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Appointments')
                ->has('appointments.data', 1));

        $this->actingAs($admin)
            ->get('/admin/appointments?doctor_id='.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('appointments.data', 1));

        $this->actingAs($admin)
            ->get('/admin/appointments?date='.$start->copy()->addYear()->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('appointments.data', 0));
    }

    public function test_13_admin_routes_forbidden_for_patient_and_doctor_users_forbidden_for_admin(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->firstOrFail();

        foreach ([$patient->user, $doctor->user] as $user) {
            $this->actingAs($user)->get('/admin/appointments')->assertForbidden();
            $this->actingAs($user)->get('/admin/doctors')->assertForbidden();
            $this->actingAs($user)->get('/admin/patients')->assertForbidden();
            $this->actingAs($user)->get('/admin/admins')->assertForbidden();
            $this->actingAs($user)->get('/admin/settings')->assertForbidden();
            $this->actingAs($user)->get('/admin/settings/specialties')->assertForbidden();
            $this->actingAs($user)->get('/admin/settings/specialties/'.$specialty->id.'/edit')->assertForbidden();
        }

        $this->actingAs($admin)->get('/admin/patients')->assertForbidden();
        $this->actingAs($admin)->get('/admin/admins')->assertForbidden();
        $this->actingAs($admin)->get('/admin/settings')->assertForbidden();
        $this->actingAs($admin)->get('/admin/settings/specialties')->assertForbidden();
        $this->actingAs($admin)->get('/admin/settings/specialties/'.$specialty->id.'/edit')->assertForbidden();
    }

    public function test_14_admin_creates_doctor_user_entity_and_role(): void
    {
        $admin = $this->makeAdmin();
        $specialty = Specialty::query()->firstOrFail();

        $this->actingAs($admin)
            ->post('/admin/doctors', [
                'name' => 'Carla Ruiz',
                'email' => 'carla@example.com',
                'password' => 'password',
                'license_number' => 'MN-88888',
                'specialty_ids' => [$specialty->id],
            ])
            ->assertRedirect();

        $user = User::query()->where('email', 'carla@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('doctor'));
        $this->assertNotNull($user->doctor);
        $this->assertSame('MN-88888', $user->doctor->license_number);
        $this->assertDatabaseCount('doctor_specialty', 1);
        $this->assertDatabaseHas('doctor_specialty', [
            'doctor_id' => $user->doctor->id,
            'specialty_id' => $specialty->id,
        ]);
    }

    public function test_14_admin_creates_doctor_with_multiple_specialties_and_rejects_empty_or_scalar(): void
    {
        $admin = $this->makeAdmin();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();

        $this->actingAs($admin)
            ->post('/admin/doctors', [
                'name' => 'Ana Dual',
                'email' => 'ana.dual@example.com',
                'password' => 'password',
                'license_number' => 'MN-88887',
                'specialty_ids' => [$cardio->id, $derm->id],
            ])
            ->assertRedirect();

        $doctor = User::query()->where('email', 'ana.dual@example.com')->first()?->doctor;
        $this->assertNotNull($doctor);
        $this->assertDatabaseCount('doctor_specialty', 2);
        $this->assertEqualsCanonicalizing(
            [$cardio->id, $derm->id],
            $doctor->specialties()->pluck('specialties.id')->all(),
        );

        $this->actingAs($admin)
            ->from('/admin/doctors')
            ->post('/admin/doctors', [
                'name' => 'Sin Especialidad',
                'email' => 'sin.esp@example.com',
                'password' => 'password',
                'license_number' => 'MN-88886',
                'specialty_ids' => [],
            ])
            ->assertSessionHasErrors('specialty_ids');

        $this->actingAs($admin)
            ->from('/admin/doctors')
            ->post('/admin/doctors', [
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

    public function test_15_manual_link_doctor_self_only_admin_any_duplicate_idempotent(): void
    {
        $doctorA = $this->makeDoctor();
        $doctorB = $this->makeDoctor();
        $patient = $this->makePatient();
        $admin = $this->makeAdmin();

        $this->actingAs($doctorA->user)
            ->post('/my-patients', ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseCount('doctor_patient', 1);

        $this->actingAs($doctorA->user)
            ->post('/my-patients', ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseCount('doctor_patient', 1);

        $this->actingAs($doctorB->user)
            ->post('/admin/doctors/'.$doctorA->id.'/patients', ['patient_id' => $patient->id])
            ->assertForbidden();

        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctorB->id.'/patients', ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseCount('doctor_patient', 2);
    }

    public function test_16_doctor_sees_only_own_patients_and_can_search(): void
    {
        $doctor = $this->makeDoctor();
        $own = $this->makePatient(['name' => 'Marta Propia'], ['dni' => '33999888']);
        $other = $this->makePatient(['name' => 'Otro Paciente']);
        $doctor->patients()->syncWithoutDetaching([$own->id]);

        $this->actingAs($doctor->user)
            ->get('/my-patients')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('patients', 1));

        $this->actingAs($doctor->user)
            ->get('/my-patients?q=3399')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('candidates', 1));

        $this->actingAs($doctor->user)
            ->get('/my-patients?q=Ot')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('candidates', 1));
    }

    public function test_17_post_login_and_register_go_to_portal_homes(): void
    {
        $patient = $this->makePatient(['email' => 'p@example.com']);
        $doctor = $this->makeDoctor(['email' => 'd@example.com']);
        $admin = $this->makeAdmin(['email' => 'a@example.com']);

        $this->post('/login', ['email' => 'p@example.com', 'password' => 'password'])
            ->assertRedirect('/home');

        $this->post('/logout');

        $this->post('/login', ['email' => 'd@example.com', 'password' => 'password'])
            ->assertRedirect('/home');

        $this->post('/logout');

        $this->post('/login', ['email' => 'a@example.com', 'password' => 'password'])
            ->assertRedirect('/admin/appointments');

        $this->post('/logout');

        $super = $this->makeSuperAdmin(['email' => 's@example.com']);
        $this->post('/login', ['email' => 's@example.com', 'password' => 'password'])
            ->assertRedirect('/admin/appointments');

        $this->actingAs($admin)->get('/home')->assertRedirect('/admin/appointments');
        $this->actingAs($super)->get('/home')->assertRedirect('/admin/appointments');
        $this->actingAs($patient->user)->get('/home')->assertInertia(fn ($page) => $page->component('Patient/Home'));
        $this->actingAs($doctor->user)->get('/home')->assertInertia(fn ($page) => $page->component('Doctor/Home'));
    }

    public function test_17_program_routes_stay_in_own_or_any_family(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();
        $super = $this->makeSuperAdmin();
        $start = $this->nextWeekdayNine();

        $this->actingAs($doctor->user)
            ->get('/agenda/program')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Doctor/Program'));

        foreach ([$patient->user, $admin, $super] as $user) {
            $this->actingAs($user)->get('/agenda/program')->assertForbidden();
        }

        $payload = [
            'dates' => [$start->toDateString()],
            'ranges' => [['start' => '11:00', 'end' => '12:00']],
            'block_weekends' => false,
        ];

        $this->actingAs($doctor->user)
            ->post('/admin/doctors/'.$doctor->id.'/windows/program', $payload)
            ->assertForbidden();

        $this->actingAs($patient->user)
            ->post('/admin/doctors/'.$doctor->id.'/windows/program', $payload)
            ->assertForbidden();

        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctor->id.'/windows/program', $payload)
            ->assertRedirect();

        $this->actingAs($super)
            ->post('/admin/doctors/'.$doctor->id.'/windows/program', [
                'dates' => [$start->copy()->addDay()->toDateString()],
                'ranges' => [['start' => '11:00', 'end' => '12:00']],
                'block_weekends' => false,
            ])
            ->assertRedirect();
    }

    public function test_18_wizard_specialty_filters_doctors_and_booking_inserts(): void
    {
        $patient = $this->makePatient();
        $cardio = Specialty::query()->where('name', 'Cardiología')->firstOrFail();
        $derm = Specialty::query()->where('name', 'Dermatología')->firstOrFail();
        $doctor = $this->makeDoctor(['name' => 'Ana Pérez'], ['specialty_ids' => [$cardio->id, $derm->id]]);
        $other = Specialty::query()->where('name', 'Pediatría')->firstOrFail();
        $this->makeDoctor(['name' => 'Otro'], ['specialty_id' => $other->id]);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->get('/book?specialty_id='.$cardio->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('doctors', 1)
                ->where('doctors.0.user.name', 'Ana Pérez'));

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, $start, $cardio->id))
            ->assertRedirect('/my-appointments');

        $this->assertDatabaseCount('appointments', 1);
        $this->assertTrue(Schema::hasColumn('appointments', 'specialty_id'));
        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'specialty_id' => $cardio->id,
        ]);
        $this->assertDatabaseMissing('appointments', [
            'specialty_id' => $derm->id,
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_19_program_persists_n_by_m_windows_and_zero_appointments(): void
    {
        $doctor = $this->makeDoctor();
        $wednesday = now()->next(Carbon::WEDNESDAY);
        $thursday = $wednesday->copy()->addDay();
        $saturday = $wednesday->copy()->next(Carbon::SATURDAY);

        $this->actingAs($doctor->user)
            ->post('/agenda/program', [
                'dates' => [$wednesday->toDateString(), $thursday->toDateString()],
                'ranges' => [
                    ['start' => '09:00', 'end' => '10:00'],
                    ['start' => '14:00', 'end' => '15:00'],
                ],
                'block_weekends' => false,
            ])
            ->assertRedirect('/agenda');

        $this->assertDatabaseCount('availability_windows', 4);
        $this->assertDatabaseCount('appointments', 0);

        $this->actingAs($doctor->user)
            ->post('/agenda/program', [
                'dates' => [$saturday->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '10:00']],
                'block_weekends' => true,
            ])
            ->assertSessionHasErrors('dates');

        $this->assertDatabaseCount('availability_windows', 4);

        $overlapDay = $wednesday->toDateString();
        $this->actingAs($doctor->user)
            ->post('/agenda/program', [
                'dates' => [$overlapDay],
                'ranges' => [['start' => '09:30', 'end' => '10:30']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors();

        $this->assertDatabaseCount('availability_windows', 4);

        $slots = app(AvailabilityService::class)
            ->calculateSlots($doctor, $wednesday->copy()->startOfDay(), $wednesday->copy()->endOfDay());

        $this->assertCount(6, $slots);
    }

    public function test_20_assign_inserts_on_calculated_slot_and_rejects_unlinked(): void
    {
        $doctor = $this->makeDoctor();
        $linked = $this->makePatient();
        $unlinked = $this->makePatient();
        $doctor->patients()->syncWithoutDetaching([$linked->id]);
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($doctor->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $unlinked->id,
                'specialty_id' => $this->specialtyIdOf($doctor),
            ])
            ->assertSessionHasErrors('patient_id');

        $this->actingAs($doctor->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
            ])
            ->assertSessionHasErrors('specialty_id');

        $this->actingAs($doctor->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $this->specialtyIdOf($doctor),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('appointments', 1);
        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'patient_id' => $linked->id,
            'specialty_id' => $this->specialtyIdOf($doctor),
        ]);

        $other = Specialty::query()->where('name', 'Dermatología')->firstOrFail();

        $this->actingAs($doctor->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $other->id,
            ])
            ->assertSessionHasErrors();

        $this->actingAs($doctor->user)
            ->post('/agenda/appointments', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
                'patient_id' => $linked->id,
                'specialty_id' => $this->specialtyIdOf($doctor),
            ])
            ->assertSessionHasErrors('starts_at');

        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_21_profiles_patient_sees_doctor_doctor_sees_linked_patient(): void
    {
        $doctor = $this->makeDoctor();
        $linked = $this->makePatient();
        $other = $this->makePatient();
        $doctor->patients()->syncWithoutDetaching([$linked->id]);

        $this->actingAs($linked->user)
            ->get('/doctors/'.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Doctors/Show'));

        $this->actingAs($this->makeAdmin())
            ->get('/doctors/'.$doctor->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Doctors/Show'));

        $this->actingAs($doctor->user)
            ->get('/my-patients/'.$linked->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Doctor/PatientProfile'));

        $this->actingAs($doctor->user)
            ->get('/my-patients/'.$other->id)
            ->assertForbidden();
    }

    public function test_22_admin_can_persist_windows_for_another_doctor(): void
    {
        $admin = $this->makeAdmin();
        $doctor = $this->makeDoctor();
        $start = $this->nextWeekdayNine();

        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctor->id.'/windows', [
                'starts_at' => $start->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('availability_windows', 1);
        $this->assertDatabaseHas('availability_windows', ['doctor_id' => $doctor->id]);

        $thursday = $start->copy()->next(Carbon::THURSDAY);
        $this->actingAs($admin)
            ->post('/admin/doctors/'.$doctor->id.'/windows/program', [
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
        $doctor = $this->makeDoctor();
        $past = now()->subDay()->setTime(10, 0, 0);
        $future = $this->nextWeekdayNine();

        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'starts_at' => $past,
            'ends_at' => $past->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'starts_at' => $future,
            'ends_at' => $future->copy()->addMinutes(20),
        ]);
        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $other->id,
            'starts_at' => $past->copy()->subDay(),
            'ends_at' => $past->copy()->subDay()->addMinutes(20),
        ]);

        $this->actingAs($patient->user)
            ->get('/my-appointments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/Index')
                ->has('appointments', 1)
                ->where('appointments.0.starts_at', $future->format('Y-m-d H:i:s'))
                ->where('appointments.0.specialty.id', $this->specialtyIdOf($doctor))
                ->where('today', now()->toDateString()));

        $this->actingAs($patient->user)
            ->get('/my-appointments/history')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Appointments/History')
                ->has('appointments', 1)
                ->where('appointments.0.starts_at', $past->format('Y-m-d H:i:s')));

        $this->actingAs($this->makeDoctor()->user)
            ->get('/my-appointments/history')
            ->assertForbidden();
    }

    /**
     * @return array{0: Patient, 1: Doctor, 2: Carbon, 3: Appointment}
     */
    private function bookedSetup(): array
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $start = $this->nextWeekdayNine();
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($patient->user)
            ->post('/doctors/'.$doctor->id.'/appointments', $this->reservationPayload($doctor, $start));

        $appointment = Appointment::query()->firstOrFail();

        return [$patient, $doctor, $start, $appointment];
    }

    /**
     * @return array{starts_at: string, specialty_id: int}
     */
    private function reservationPayload(Doctor $doctor, Carbon $start, ?int $specialtyId = null): array
    {
        return [
            'starts_at' => $start->format('Y-m-d H:i:s'),
            'specialty_id' => $specialtyId ?? $this->specialtyIdOf($doctor),
        ];
    }

    private function specialtyIdOf(Doctor $doctor): int
    {
        $id = $doctor->specialties->first()?->id;

        $this->assertNotNull($id);

        return (int) $id;
    }

    private function nextWeekdayNine(): Carbon
    {
        return now()->next(Carbon::WEDNESDAY)->setTime(9, 0, 0);
    }
}
