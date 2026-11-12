<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Models\ClinicSchedule;
use App\Support\RoleRedirector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ClinicScheduleTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        Carbon::setTestNow(Carbon::parse('2026-10-15 10:00:00'));
    }

    public function test_only_super_admin_can_edit_the_sanatorium_schedule(): void
    {
        $this->assertContains('clinic.manage', Permission::namesForRole('super_admin'));
        $this->assertNotContains('clinic.manage', Permission::namesForRole('admin'));

        $patient = $this->makePatient();
        $professional = $this->makeProfessional();
        $admin = $this->makeAdmin();

        foreach ([$patient->user, $professional->user, $admin] as $user) {
            $this->actingAs($user)->get('/admin/configuracion/sanatorio')->assertRedirect(RoleRedirector::landing($user));
            $this->actingAs($user)->patch('/admin/configuracion/sanatorio', [
                'open_days' => [1, 2, 3, 4, 5],
                'opens_at' => '08:00',
                'closes_at' => '18:00',
            ])->assertRedirect(RoleRedirector::landing($user));
        }

        $this->actingAs($this->makeSuperAdmin())
            ->get('/admin/configuracion/sanatorio')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Clinic')
                ->where('clinic.openDays', [1, 2, 3, 4, 5, 6, 7])
                ->where('clinic.opensAt', '07:00')
                ->where('clinic.closesAt', '21:00'));
    }

    public function test_super_admin_saves_open_days_and_hours(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->from('/admin/configuracion/sanatorio')
            ->patch('/admin/configuracion/sanatorio', [
                'open_days' => [1, 2, 3, 4, 5, 6],
                'opens_at' => '08:00',
                'closes_at' => '18:00',
            ])
            ->assertRedirect('/admin/configuracion/sanatorio')
            ->assertSessionHas('toast', fn (array $toast): bool => ($toast['message'] ?? '') === 'Guardaste el horario del sanatorio.');

        $schedule = ClinicSchedule::query()->firstOrFail();
        $this->assertSame([1, 2, 3, 4, 5, 6], array_map(intval(...), $schedule->open_days));
        $this->assertSame('08:00:00', substr((string) $schedule->opens_at, 0, 8));
        $this->assertSame('18:00:00', substr((string) $schedule->closes_at, 0, 8));
    }

    public function test_schedule_requires_a_day_and_a_closing_time_after_opening(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->from('/admin/configuracion/sanatorio')
            ->patch('/admin/configuracion/sanatorio', [
                'open_days' => [],
                'opens_at' => '18:00',
                'closes_at' => '08:00',
            ])
            ->assertSessionHasErrors(['open_days', 'closes_at']);
    }

    public function test_closed_day_and_hours_outside_the_schedule_cannot_be_programmed(): void
    {
        ClinicSchedule::query()->firstOrFail()->update([
            'open_days' => [1, 2, 3, 4, 5, 6],
            'opens_at' => '08:00:00',
            'closes_at' => '18:00:00',
        ]);

        $professional = $this->makeProfessional();
        $sunday = '2026-10-18';
        $thursday = '2026-10-15';

        $this->actingAs($professional->user)
            ->from('/profesional/programar')
            ->post('/agenda/program', [
                'dates' => [$sunday],
                'ranges' => [['start' => '09:00', 'end' => '12:00']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors('dates');

        $this->actingAs($professional->user)
            ->from('/profesional/programar')
            ->post('/agenda/program', [
                'dates' => [$thursday],
                'ranges' => [['start' => '07:00', 'end' => '09:00']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors('ranges');

        $this->assertDatabaseCount('availability_windows', 0);

        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => [$thursday],
                'ranges' => [['start' => '08:00', 'end' => '10:00']],
                'block_weekends' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('availability_windows', 1);

        $this->actingAs($professional->user)
            ->from('/profesional/agenda')
            ->post('/agenda/windows', [
                'starts_at' => $sunday.' 09:00:00',
            ])
            ->assertSessionHasErrors('dates');

        $this->actingAs($professional->user)
            ->from('/profesional/agenda')
            ->post('/agenda/windows', [
                'starts_at' => $thursday.' 17:50:00',
            ])
            ->assertSessionHasErrors('ranges');

        $this->assertDatabaseCount('availability_windows', 1);
    }
}
