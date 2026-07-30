<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AppointmentFlowTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    public function test_public_registration_creates_user_patient_and_patient_role(): void
    {
        $this->seedRoles();

        $response = $this->post('/register', [
            'name' => 'Paciente Nuevo',
            'email' => 'nuevo@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '40111222',
            'birth_date' => '1995-05-10',
        ]);

        $response->assertRedirect(route('doctors.index', absolute: false));
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'nuevo@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('patient'));
        $this->assertDatabaseHas('patients', [
            'user_id' => $user->id,
            'dni' => '40111222',
        ]);
    }

    public function test_patient_can_search_doctors_by_name_and_does_not_see_non_doctors(): void
    {
        $patient = $this->createPatient();
        $this->seedSpecialties();
        $specialty = Specialty::query()->first();
        $otherSpecialty = Specialty::query()->where('id', '!=', $specialty->id)->first();
        $matching = $this->createDoctor(['name' => 'Dra. Ana Pérez'], ['specialty_id' => $specialty->id]);
        $this->createDoctor(['name' => 'Dr. Luis Gómez'], [
            'specialty_id' => $otherSpecialty->id,
        ]);
        User::factory()->create(['name' => 'Ana NoDoctora']);

        $response = $this->actingAs($patient->user)
            ->get(route('doctors.index', [
                'specialty_id' => $specialty->id,
                'name' => 'Ana',
            ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('doctors/index')
            ->has('doctors', 1)
            ->where('doctors.0.id', $matching->id)
            ->has('specialties')
        );
    }

    public function test_patient_must_select_specialty_before_seeing_doctors(): void
    {
        $patient = $this->createPatient();
        $this->createDoctor(['name' => 'Dra. Ana Pérez']);
        $specialty = Specialty::query()->first();

        $withoutFilters = $this->actingAs($patient->user)
            ->get(route('doctors.index'));

        $withoutFilters->assertOk();
        $withoutFilters->assertInertia(fn ($page) => $page
            ->component('doctors/index')
            ->has('doctors', 0)
            ->has('specialties')
        );

        $withSpecialty = $this->actingAs($patient->user)
            ->get(route('doctors.index', ['specialty_id' => $specialty->id]));

        $withSpecialty->assertOk();
        $withSpecialty->assertInertia(fn ($page) => $page
            ->component('doctors/index')
            ->has('doctors', 1)
            ->where('filters.specialty_id', $specialty->id)
        );
    }

    public function test_patient_can_search_doctors_by_name_without_specialty(): void
    {
        $patient = $this->createPatient();
        $matching = $this->createDoctor(['name' => 'Dra. Ana Pérez']);
        $this->createDoctor(['name' => 'Dr. Luis Gómez']);

        $response = $this->actingAs($patient->user)
            ->get(route('doctors.index', ['name' => 'Ana']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('doctors/index')
            ->has('doctors', 1)
            ->where('doctors.0.id', $matching->id)
        );
    }

    public function test_patient_sees_only_available_future_slots(): void
    {
        $patient = $this->createPatient();
        $doctor = $this->createDoctor();

        $futureAvailable = Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addMinutes(30),
        ]);

        Appointment::factory()->booked($patient)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(3),
            'ends_at' => now()->addDays(3)->addMinutes(30),
        ]);

        Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->subDay()->addMinutes(30),
        ]);

        $response = $this->actingAs($patient->user)
            ->get(route('doctors.slots', $doctor));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('doctors/slots')
            ->has('slots', 1)
            ->where('slots.0.id', $futureAvailable->id)
        );
    }

    public function test_successful_booking_sets_booked_status_and_patient_id(): void
    {
        $patient = $this->createPatient();
        $doctor = $this->createDoctor();
        $slot = Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addMinutes(30),
        ]);

        $response = $this->actingAs($patient->user)
            ->post(route('appointments.book', $slot));

        $response->assertRedirect(route('my-appointments.index', absolute: false));
        $this->assertDatabaseHas('appointments', [
            'id' => $slot->id,
            'status' => Appointment::STATUS_BOOKED,
            'patient_id' => $patient->id,
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_double_booking_second_patient_gets_error(): void
    {
        $patientA = $this->createPatient(['email' => 'a@example.com'], ['dni' => '11111111']);
        $patientB = $this->createPatient(['email' => 'b@example.com'], ['dni' => '22222222']);
        $doctor = $this->createDoctor();
        $slot = Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addMinutes(30),
        ]);

        $this->actingAs($patientA->user)->post(route('appointments.book', $slot));

        $response = $this->actingAs($patientB->user)->post(route('appointments.book', $slot));

        $response->assertSessionHasErrors('appointment');
        $this->assertDatabaseHas('appointments', [
            'id' => $slot->id,
            'patient_id' => $patientA->id,
            'status' => Appointment::STATUS_BOOKED,
        ]);
    }

    public function test_patient_cannot_book_past_or_already_booked_slots(): void
    {
        $patient = $this->createPatient();
        $other = $this->createPatient(['email' => 'other@example.com'], ['dni' => '33333333']);
        $doctor = $this->createDoctor();

        $past = Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->subHour()->addMinutes(30),
        ]);

        $booked = Appointment::factory()->booked($other)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(4),
            'ends_at' => now()->addDays(4)->addMinutes(30),
        ]);

        $this->actingAs($patient->user)
            ->post(route('appointments.book', $past))
            ->assertSessionHasErrors('appointment');

        $this->actingAs($patient->user)
            ->post(route('appointments.book', $booked))
            ->assertSessionHasErrors('appointment');
    }

    public function test_cancellation_by_patient_doctor_and_admin_reopens_slot(): void
    {
        $patient = $this->createPatient();
        $doctor = $this->createDoctor();
        $admin = $this->createAdmin();

        // Patient cancels own
        $a1 = Appointment::factory()->booked($patient)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(6)->setTime(10, 0),
            'ends_at' => now()->addDays(6)->setTime(10, 30),
        ]);
        $doctor->patients()->syncWithoutDetaching([$patient->id]);
        $this->actingAs($patient->user)->post(route('appointments.cancel', $a1))->assertRedirect();
        $this->assertDatabaseHas('appointments', [
            'id' => $a1->id,
            'status' => Appointment::STATUS_AVAILABLE,
            'patient_id' => null,
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        // Doctor cancels own agenda
        $patient2 = $this->createPatient(['email' => 'p2b@example.com'], ['dni' => '66666666']);
        $a2 = Appointment::factory()->booked($patient2)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(6)->setTime(11, 0),
            'ends_at' => now()->addDays(6)->setTime(11, 30),
        ]);
        $doctor->patients()->syncWithoutDetaching([$patient2->id]);
        $this->actingAs($doctor->user)->post(route('appointments.cancel', $a2))->assertRedirect();
        $this->assertDatabaseHas('appointments', [
            'id' => $a2->id,
            'status' => Appointment::STATUS_AVAILABLE,
            'patient_id' => null,
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient2->id,
        ]);

        // Admin cancels any
        $patient3 = $this->createPatient(['email' => 'p3b@example.com'], ['dni' => '77777777']);
        $a3 = Appointment::factory()->booked($patient3)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(6)->setTime(12, 0),
            'ends_at' => now()->addDays(6)->setTime(12, 30),
        ]);
        $doctor->patients()->syncWithoutDetaching([$patient3->id]);
        $this->actingAs($admin)->post(route('appointments.cancel', $a3))->assertRedirect();
        $this->assertDatabaseHas('appointments', [
            'id' => $a3->id,
            'status' => Appointment::STATUS_AVAILABLE,
            'patient_id' => null,
        ]);
        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient3->id,
        ]);
    }

    public function test_patient_cannot_cancel_someone_elses_appointment(): void
    {
        $patient = $this->createPatient();
        $other = $this->createPatient(['email' => 'other2@example.com'], ['dni' => '88888888']);
        $doctor = $this->createDoctor();
        $appointment = Appointment::factory()->booked($other)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addMinutes(30),
        ]);

        $this->actingAs($patient->user)
            ->post(route('appointments.cancel', $appointment))
            ->assertForbidden();
    }

    public function test_doctor_sees_only_own_agenda_and_cannot_create_slots_for_others(): void
    {
        $doctor = $this->createDoctor(['email' => 'doc1@example.com']);
        $otherDoctor = $this->createDoctor(['email' => 'doc2@example.com']);

        Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(8)->setTime(9, 0),
            'ends_at' => now()->addDays(8)->setTime(9, 30),
        ]);
        Appointment::factory()->available()->create([
            'doctor_id' => $otherDoctor->id,
            'starts_at' => now()->addDays(8)->setTime(10, 0),
            'ends_at' => now()->addDays(8)->setTime(10, 30),
        ]);

        $this->actingAs($doctor->user)
            ->get(route('agenda.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('doctor/agenda')
                ->has('appointments', 1)
                ->where('appointments.0.doctor_id', $doctor->id)
            );

        // Doctor slot creation always uses authenticated doctor — no doctor_id param.
        // Creating for self works:
        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'classic',
                'starts_at' => now()->addDays(9)->setTime(9, 0)->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(9)->setTime(9, 0)->format('Y-m-d H:i:s'),
            'ends_at' => now()->addDays(9)->setTime(9, 20)->format('Y-m-d H:i:s'),
        ]);

        $this->assertDatabaseMissing('appointments', [
            'doctor_id' => $otherDoctor->id,
            'starts_at' => now()->addDays(9)->setTime(9, 0)->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_slot_validation_rejects_past_invalid_range_and_overlaps(): void
    {
        $doctor = $this->createDoctor();

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'classic',
                'starts_at' => now()->subHour()->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('starts_at');

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'range',
                'starts_at' => now()->addDays(10)->setTime(10, 0)->format('Y-m-d H:i:s'),
                'ends_at' => now()->addDays(10)->setTime(9, 0)->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('ends_at');

        Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(10)->setTime(11, 0),
            'ends_at' => now()->addDays(10)->setTime(11, 30),
        ]);

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'classic',
                'starts_at' => now()->addDays(10)->setTime(11, 15)->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('starts_at');
    }

    public function test_booked_slot_cannot_be_deleted_available_can(): void
    {
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();

        $available = Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(11)->setTime(9, 0),
            'ends_at' => now()->addDays(11)->setTime(9, 30),
        ]);

        $booked = Appointment::factory()->booked($patient)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(11)->setTime(10, 0),
            'ends_at' => now()->addDays(11)->setTime(10, 30),
        ]);

        $this->actingAs($doctor->user)
            ->delete(route('agenda.slots.destroy', $booked))
            ->assertSessionHasErrors('appointment');

        $this->actingAs($doctor->user)
            ->delete(route('agenda.slots.destroy', $available))
            ->assertRedirect();

        $this->assertDatabaseMissing('appointments', ['id' => $available->id]);
        $this->assertDatabaseHas('appointments', ['id' => $booked->id]);
    }

    public function test_admin_can_list_and_filter_appointments(): void
    {
        $admin = $this->createAdmin();
        $doctor = $this->createDoctor();
        $patient = $this->createPatient();

        $target = Appointment::factory()->booked($patient)->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(12)->setTime(9, 0),
            'ends_at' => now()->addDays(12)->setTime(9, 30),
        ]);

        Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => now()->addDays(13)->setTime(9, 0),
            'ends_at' => now()->addDays(13)->setTime(9, 30),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.appointments.index', [
                'doctor_id' => $doctor->id,
                'patient_id' => $patient->id,
                'date' => now()->addDays(12)->toDateString(),
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/appointments')
                ->has('appointments.data', 1)
                ->where('appointments.data.0.id', $target->id)
            );
    }

    public function test_admin_routes_forbidden_for_patient_and_doctor_users_route_for_admin(): void
    {
        $patient = $this->createPatient();
        $doctor = $this->createDoctor();
        $admin = $this->createAdmin('admin');
        $super = $this->createAdmin('super_admin', ['email' => 'super@example.com']);

        $this->actingAs($patient->user)->get(route('admin.appointments.index'))->assertForbidden();
        $this->actingAs($doctor->user)->get(route('admin.appointments.index'))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.appointments.index'))->assertOk();

        $this->actingAs($admin)->get(route('admin.users.index'))->assertForbidden();
        $this->actingAs($super)->get(route('admin.users.index'))->assertOk();
    }

    public function test_admin_can_create_doctor_with_user_and_role(): void
    {
        $admin = $this->createAdmin();
        $this->seedSpecialties();
        $specialty = Specialty::query()->first();

        $response = $this->actingAs($admin)->post(route('admin.doctors.store'), [
            'name' => 'Dr. Nuevo',
            'email' => 'nuevo.doctor@example.com',
            'password' => 'password',
            'specialty_id' => $specialty->id,
            'license_number' => 'MN-999999',
        ]);

        $response->assertRedirect();

        $user = User::query()->where('email', 'nuevo.doctor@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('doctor'));
        $this->assertDatabaseHas('doctors', [
            'user_id' => $user->id,
            'license_number' => 'MN-999999',
            'specialty_id' => $specialty->id,
            'slot_duration_minutes' => 20,
        ]);
    }

    public function test_doctor_can_update_slot_duration_in_settings(): void
    {
        $doctor = $this->createDoctor();

        $this->actingAs($doctor->user)
            ->get(route('settings.agenda.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/agenda')
                ->where('doctor.slot_duration_minutes', 20)
                ->where('doctor.weekly_availability', [])
            );

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 30,
            ])
            ->assertRedirect();

        $this->assertSame(30, $doctor->fresh()->slot_duration_minutes);

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 3,
            ])
            ->assertSessionHasErrors('slot_duration_minutes');

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 200,
            ])
            ->assertSessionHasErrors('slot_duration_minutes');
    }

    public function test_doctor_can_save_weekly_availability_template(): void
    {
        $doctor = $this->createDoctor();

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 20,
                'weekly_availability' => [
                    ['weekday' => 1, 'start' => '10:00', 'end' => '12:00'],
                    ['weekday' => 1, 'start' => '15:00', 'end' => '19:00'],
                ],
            ])
            ->assertRedirect();

        $saved = $doctor->fresh()->weekly_availability;
        $this->assertCount(2, $saved);
        $this->assertSame(1, (int) $saved[0]['weekday']);
        $this->assertSame('10:00', $saved[0]['start']);
        $this->assertSame('12:00', $saved[0]['end']);
        $this->assertSame(1, (int) $saved[1]['weekday']);
        $this->assertSame('15:00', $saved[1]['start']);
        $this->assertSame('19:00', $saved[1]['end']);
    }

    public function test_weekly_availability_validation_rejects_invalid_bands(): void
    {
        $doctor = $this->createDoctor();

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 20,
                'weekly_availability' => [
                    ['weekday' => 1, 'start' => '12:00', 'end' => '10:00'],
                ],
            ])
            ->assertSessionHasErrors('weekly_availability.0.end');

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 20,
                'weekly_availability' => [
                    ['weekday' => 8, 'start' => '10:00', 'end' => '12:00'],
                ],
            ])
            ->assertSessionHasErrors('weekly_availability.0.weekday');

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 20,
                'weekly_availability' => [
                    ['weekday' => 1, 'start' => '10:00', 'end' => '12:00'],
                    ['weekday' => 1, 'start' => '11:00', 'end' => '13:00'],
                ],
            ])
            ->assertSessionHasErrors('weekly_availability.1.start');
    }

    public function test_generate_current_month_from_weekly_template(): void
    {
        $this->travelTo(now()->copy()->setDate(2026, 7, 6)->setTime(8, 0));

        $doctor = $this->createDoctor(doctorAttributes: [
            'slot_duration_minutes' => 20,
            'weekly_availability' => [
                ['weekday' => 1, 'start' => '10:00', 'end' => '12:00'],
            ],
        ]);

        $this->actingAs($doctor->user)
            ->post(route('settings.agenda.generate'), ['target' => 'current'])
            ->assertRedirect()
            ->assertSessionHas('success');

        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        $expected = 0;
        $day = $monthStart->copy()->startOfDay();

        while ($day->lte($monthEnd)) {
            if ($day->dayOfWeekIso === 1) {
                for ($hour = 10; $hour < 12; $hour++) {
                    foreach ([0, 20, 40] as $minute) {
                        $starts = $day->copy()->setTime($hour, $minute);
                        if ($starts->gt(now())) {
                            $expected++;
                        }
                    }
                }
            }
            $day->addDay();
        }

        $this->assertGreaterThan(0, $expected);
        $this->assertSame(
            $expected,
            Appointment::query()->forDoctor($doctor->id)->count(),
        );

        Appointment::query()->forDoctor($doctor->id)->each(function (Appointment $appointment): void {
            $this->assertTrue($appointment->starts_at->gt(now()));
            $this->assertSame(1, $appointment->starts_at->dayOfWeekIso);
            $this->assertSame(Appointment::STATUS_AVAILABLE, $appointment->status);
        });
    }

    public function test_generate_skips_overlaps_and_does_not_mutate_booked(): void
    {
        $this->travelTo(now()->copy()->setDate(2026, 7, 6)->setTime(8, 0));

        $doctor = $this->createDoctor(doctorAttributes: [
            'slot_duration_minutes' => 20,
            'weekly_availability' => [
                ['weekday' => 1, 'start' => '10:00', 'end' => '12:00'],
            ],
        ]);
        $patient = $this->createPatient();

        $bookedStart = now()->copy()->setDate(2026, 7, 6)->setTime(10, 0);

        $booked = Appointment::factory()->booked()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'starts_at' => $bookedStart,
            'ends_at' => $bookedStart->copy()->addMinutes(20),
        ]);

        $this->actingAs($doctor->user)
            ->post(route('settings.agenda.generate'), ['target' => 'current'])
            ->assertRedirect();

        $booked->refresh();
        $this->assertSame(Appointment::STATUS_BOOKED, $booked->status);
        $this->assertSame($patient->id, $booked->patient_id);

        $this->assertSame(
            1,
            Appointment::query()
                ->forDoctor($doctor->id)
                ->where('starts_at', $bookedStart->format('Y-m-d H:i:s'))
                ->count(),
        );

        $this->assertGreaterThan(
            1,
            Appointment::query()->forDoctor($doctor->id)->count(),
        );
    }

    public function test_generate_next_month_only_creates_slots_in_next_month(): void
    {
        $this->travelTo(now()->copy()->setDate(2026, 7, 15)->setTime(12, 0));

        $doctor = $this->createDoctor(doctorAttributes: [
            'slot_duration_minutes' => 60,
            'weekly_availability' => [
                ['weekday' => 2, 'start' => '09:00', 'end' => '10:00'],
            ],
        ]);

        $this->actingAs($doctor->user)
            ->post(route('settings.agenda.generate'), ['target' => 'next'])
            ->assertRedirect();

        $appointments = Appointment::query()->forDoctor($doctor->id)->get();
        $this->assertNotEmpty($appointments);

        $nextMonth = now()->startOfMonth()->addMonth();
        foreach ($appointments as $appointment) {
            $this->assertSame($nextMonth->year, $appointment->starts_at->year);
            $this->assertSame($nextMonth->month, $appointment->starts_at->month);
            $this->assertSame(2, $appointment->starts_at->dayOfWeekIso);
        }

        $this->actingAs($doctor->user)
            ->post(route('settings.agenda.generate'), ['target' => 'next'])
            ->assertRedirect();

        $this->assertSame(
            $appointments->count(),
            Appointment::query()->forDoctor($doctor->id)->count(),
        );
    }

    public function test_generate_requires_saved_template(): void
    {
        $doctor = $this->createDoctor(doctorAttributes: [
            'weekly_availability' => [],
        ]);

        $this->actingAs($doctor->user)
            ->post(route('settings.agenda.generate'), ['target' => 'current'])
            ->assertSessionHasErrors('weekly_availability');
    }

    public function test_non_doctor_cannot_access_agenda_settings(): void
    {
        $patient = $this->createPatient();

        $this->actingAs($patient->user)
            ->get(route('settings.agenda.edit'))
            ->assertForbidden();

        $this->actingAs($patient->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 30,
            ])
            ->assertForbidden();

        $this->actingAs($patient->user)
            ->post(route('settings.agenda.generate'), ['target' => 'current'])
            ->assertForbidden();

        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post(route('settings.agenda.generate'), ['target' => 'next'])
            ->assertForbidden();
    }

    public function test_classic_slot_uses_doctor_configured_duration(): void
    {
        $doctor = $this->createDoctor(doctorAttributes: ['slot_duration_minutes' => 45]);
        $startsAt = now()->addDays(20)->setTime(9, 0);

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'classic',
                'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            'ends_at' => $startsAt->copy()->addMinutes(45)->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_range_creates_complete_slots_and_discards_remainder(): void
    {
        $doctor = $this->createDoctor(doctorAttributes: ['slot_duration_minutes' => 20]);
        $day = now()->addDays(21);

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'range',
                'starts_at' => $day->copy()->setTime(10, 0)->format('Y-m-d H:i:s'),
                'ends_at' => $day->copy()->setTime(12, 0)->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $this->assertSame(6, Appointment::query()->forDoctor($doctor->id)->whereDate('starts_at', $day->toDateString())->count());

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'range',
                'starts_at' => $day->copy()->addDay()->setTime(10, 0)->format('Y-m-d H:i:s'),
                'ends_at' => $day->copy()->addDay()->setTime(11, 10)->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $remainderDay = $day->copy()->addDay()->toDateString();
        $slots = Appointment::query()
            ->forDoctor($doctor->id)
            ->whereDate('starts_at', $remainderDay)
            ->orderBy('starts_at')
            ->get();

        $this->assertCount(3, $slots);
        $this->assertSame(
            $day->copy()->addDay()->setTime(10, 0)->format('Y-m-d H:i:s'),
            $slots[0]->starts_at->format('Y-m-d H:i:s'),
        );
        $this->assertSame(
            $day->copy()->addDay()->setTime(11, 0)->format('Y-m-d H:i:s'),
            $slots[2]->ends_at->format('Y-m-d H:i:s'),
        );
    }

    public function test_range_shorter_than_duration_fails(): void
    {
        $doctor = $this->createDoctor(doctorAttributes: ['slot_duration_minutes' => 20]);
        $day = now()->addDays(22);

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'range',
                'starts_at' => $day->copy()->setTime(10, 0)->format('Y-m-d H:i:s'),
                'ends_at' => $day->copy()->setTime(10, 15)->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('ends_at');

        $this->assertSame(0, Appointment::query()->forDoctor($doctor->id)->count());
    }

    public function test_range_overlap_creates_nothing(): void
    {
        $doctor = $this->createDoctor(doctorAttributes: ['slot_duration_minutes' => 20]);
        $day = now()->addDays(23);

        Appointment::factory()->available()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $day->copy()->setTime(10, 30),
            'ends_at' => $day->copy()->setTime(10, 50),
        ]);

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'range',
                'starts_at' => $day->copy()->setTime(10, 0)->format('Y-m-d H:i:s'),
                'ends_at' => $day->copy()->setTime(12, 0)->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('starts_at');

        $this->assertSame(1, Appointment::query()->forDoctor($doctor->id)->count());
    }

    public function test_changing_duration_does_not_mutate_existing_slots(): void
    {
        $doctor = $this->createDoctor(doctorAttributes: ['slot_duration_minutes' => 20]);
        $startsAt = now()->addDays(24)->setTime(9, 0);

        $this->actingAs($doctor->user)
            ->post(route('agenda.slots.store'), [
                'mode' => 'classic',
                'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect();

        $appointment = Appointment::query()->forDoctor($doctor->id)->first();
        $this->assertSame(
            $startsAt->copy()->addMinutes(20)->format('Y-m-d H:i:s'),
            $appointment->ends_at->format('Y-m-d H:i:s'),
        );

        $this->actingAs($doctor->user)
            ->patch(route('settings.agenda.update'), [
                'slot_duration_minutes' => 40,
            ])
            ->assertRedirect();

        $this->assertSame(
            $startsAt->copy()->addMinutes(20)->format('Y-m-d H:i:s'),
            $appointment->fresh()->ends_at->format('Y-m-d H:i:s'),
        );
        $this->assertSame(40, $doctor->fresh()->slot_duration_minutes);
    }

    public function test_manual_link_by_doctor_and_admin_is_idempotent(): void
    {
        $doctor = $this->createDoctor(['email' => 'doc-link@example.com']);
        $otherDoctor = $this->createDoctor(['email' => 'other-doc-link@example.com']);
        $patient = $this->createPatient(['email' => 'plink@example.com'], ['dni' => '40123456']);
        $admin = $this->createAdmin();

        $this->actingAs($doctor->user)
            ->post(route('my-patients.store'), ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        $this->actingAs($doctor->user)
            ->post(route('my-patients.store'), ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertSame(1, $doctor->patients()->where('patients.id', $patient->id)->count());

        $this->actingAs($doctor->user)
            ->post(route('admin.doctors.patients.store', $otherDoctor), ['patient_id' => $patient->id])
            ->assertForbidden();

        $this->actingAs($admin)
            ->post(route('admin.doctors.patients.store', $otherDoctor), ['patient_id' => $patient->id])
            ->assertRedirect();

        $this->assertDatabaseHas('doctor_patient', [
            'doctor_id' => $otherDoctor->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_doctor_sees_only_own_patients_and_can_filter_by_dni_or_name(): void
    {
        $doctor = $this->createDoctor(['email' => 'doc-list@example.com']);
        $otherDoctor = $this->createDoctor(['email' => 'other-doc-list@example.com']);
        $matching = $this->createPatient(['name' => 'Ana Paciente', 'email' => 'ana.p@example.com'], ['dni' => '40999888']);
        $other = $this->createPatient(['name' => 'Bruno Paciente', 'email' => 'bruno.p@example.com'], ['dni' => '40888777']);
        $foreign = $this->createPatient(['name' => 'Ana Ajena', 'email' => 'ajena@example.com'], ['dni' => '40777666']);

        $doctor->patients()->syncWithoutDetaching([$matching->id, $other->id]);
        $otherDoctor->patients()->syncWithoutDetaching([$foreign->id]);

        $this->actingAs($doctor->user)
            ->get(route('my-patients.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('doctor/my-patients')
                ->has('patients', 2)
            );

        $this->actingAs($doctor->user)
            ->get(route('my-patients.index', ['q' => 'Ana']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('doctor/my-patients')
                ->has('patients', 1)
                ->where('patients.0.id', $matching->id)
            );

        $this->actingAs($doctor->user)
            ->get(route('my-patients.index', ['q' => '40999888']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('patients', 1)
                ->where('patients.0.dni', '40999888')
            );
    }
}
