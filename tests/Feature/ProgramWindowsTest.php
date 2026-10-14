<?php

namespace Tests\Feature;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class ProgramWindowsTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_program_calendar_loads_blocked_days_for_the_requested_month(): void
    {
        $professional = $this->makeProfessional();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => Carbon::parse('2026-10-14 09:00:00'),
            'ends_at' => Carbon::parse('2026-10-14 12:00:00'),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => Carbon::parse('2027-03-04 09:00:00'),
            'ends_at' => Carbon::parse('2027-03-04 12:00:00'),
        ]);

        $this->actingAs($professional->user)
            ->get('/profesional/programar?month=2027-03-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('month', '2027-03-01')
                ->where('blockedDates', function ($dates) {
                    $days = collect($dates);

                    return $days->contains('2027-03-04')
                        && ! $days->contains('2027-03-05')
                        && ! $days->contains('2026-10-14');
                })
                ->where('tones.2027-03-04', fn ($tone) => $tone !== 'empty')
                ->missing('tones.2026-10-14'));
    }

    public function test_program_rejects_a_day_that_already_has_a_window(): void
    {
        $professional = $this->makeProfessional();
        $day = Carbon::parse('2026-11-18 09:00:00');
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $day,
            'ends_at' => $day->copy()->addHours(3),
        ]);

        $this->actingAs($professional->user)
            ->from('/profesional/programar')
            ->post('/agenda/program', [
                'dates' => [$day->toDateString()],
                'ranges' => [
                    ['start' => '14:00', 'end' => '16:00'],
                    ['start' => '17:00', 'end' => '18:00'],
                ],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors('dates')
            ->assertSessionHas('toast', function (array $toast): bool {
                $message = (string) ($toast['message'] ?? '');

                return str_contains($message, '18/11/2026')
                    && str_contains($message, '09:00–12:00')
                    && str_contains($message, 'sin franjas');
            });

        $this->assertDatabaseCount('availability_windows', 1);
    }

    public function test_program_names_two_ranges_that_overlap_each_other(): void
    {
        $professional = $this->makeProfessional();
        $day = Carbon::parse('2026-11-18')->toDateString();

        $this->actingAs($professional->user)
            ->from('/profesional/programar')
            ->post('/agenda/program', [
                'dates' => [$day],
                'ranges' => [
                    ['start' => '09:00', 'end' => '12:00'],
                    ['start' => '11:00', 'end' => '13:00'],
                ],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors('ranges')
            ->assertSessionHas('toast', function (array $toast): bool {
                $message = (string) ($toast['message'] ?? '');

                return str_contains($message, '09:00–12:00')
                    && str_contains($message, '11:00–13:00')
                    && str_contains($message, 'se solapan');
            });

        $this->assertDatabaseCount('availability_windows', 0);
    }

    public function test_program_calendar_returns_today_and_clamps_a_fully_past_month(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-14 15:30:00'));

        $professional = $this->makeProfessional();
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => Carbon::parse('2026-09-10 09:00:00'),
            'ends_at' => Carbon::parse('2026-09-10 12:00:00'),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => Carbon::parse('2026-10-14 09:00:00'),
            'ends_at' => Carbon::parse('2026-10-14 12:00:00'),
        ]);

        $this->actingAs($professional->user)
            ->get('/profesional/programar?month=2026-09-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('today', '2026-10-14')
                ->where('month', '2026-10-01')
                ->where('blockedDates', function ($dates) {
                    $days = collect($dates);

                    return $days->contains('2026-10-14') && ! $days->contains('2026-09-10');
                }));

        $this->actingAs($professional->user)
            ->get('/profesional/programar?month=2026-10-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('today', '2026-10-14')
                ->where('month', '2026-10-01'));

        $this->actingAs($professional->user)
            ->get('/profesional/programar?month=2026-11-15')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('month', '2026-11-01')
                ->where('today', '2026-10-14'));
    }

    public function test_program_rejects_a_past_date_and_persists_today(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-14 15:30:00'));

        $professional = $this->makeProfessional();

        $this->actingAs($professional->user)
            ->from('/profesional/programar')
            ->post('/agenda/program', [
                'dates' => ['2026-10-13', '2026-10-14'],
                'ranges' => [['start' => '08:00', 'end' => '09:00']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors('dates');

        $message = (string) session('errors')->get('dates')[0];
        $this->assertStringContainsString('13/10/2026', $message);
        $this->assertDatabaseCount('availability_windows', 0);

        $this->actingAs($professional->user)
            ->post('/agenda/program', [
                'dates' => ['2026-10-14'],
                'ranges' => [['start' => '08:00', 'end' => '09:00']],
                'block_weekends' => false,
            ])
            ->assertRedirect('/profesional/agenda');

        $this->assertDatabaseCount('availability_windows', 1);
        $this->assertDatabaseHas('availability_windows', [
            'professional_id' => $professional->id,
            'starts_at' => '2026-10-14 08:00:00',
            'ends_at' => '2026-10-14 09:00:00',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }
}
