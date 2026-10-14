<?php

namespace Tests\Feature;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AgendaMonthTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_changing_month_loads_that_month_and_keeps_the_selected_day(): void
    {
        $professional = $this->makeProfessional();
        $selected = Carbon::parse('2026-10-14 09:00:00');
        $nextMonth = Carbon::parse('2026-11-04 09:00:00');

        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $selected,
            'ends_at' => $selected->copy()->addHours(3),
        ]);
        AvailabilityWindow::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => $nextMonth,
            'ends_at' => $nextMonth->copy()->addHours(3),
        ]);

        $this->actingAs($professional->user)
            ->get('/profesional/agenda?date=2026-10-14&month=2026-11-01')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('selectedDate', '2026-10-14')
                ->where('month', '2026-11-01')
                ->has('windows', 1)
                ->where('windows.0.starts_at', '2026-10-14 09:00:00')
                ->where('tones.2026-11-04', fn ($tone) => $tone !== 'empty')
                ->missing('tones.2026-10-14'));
    }
}
