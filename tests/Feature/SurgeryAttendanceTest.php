<?php

namespace Tests\Feature;

use App\Enums\SurgeryStatus;
use App\Models\Professional;
use App\Models\Surgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class SurgeryAttendanceTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_professional_marks_own_started_surgery_and_can_change_or_clear_it(): void
    {
        $professional = $this->makeProfessional();
        $surgery = $this->scheduledAt(now()->subMinutes(10), $professional);

        $this->actingAs($professional->user)
            ->from('/profesional/cirugias/calendario')
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'attended'])
            ->assertRedirect('/profesional/cirugias/calendario')
            ->assertSessionHas('toast.message', 'La cirugía quedó como Atendida.');
        $this->assertSame('attended', $surgery->fresh()->attendance?->value);
        $this->assertSame(SurgeryStatus::Scheduled, $surgery->fresh()->status);

        $this->actingAs($professional->user)
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'absent'])
            ->assertSessionHas('toast.message', 'La cirugía quedó como Ausente.');
        $this->assertSame('absent', $surgery->fresh()->attendance?->value);

        $this->actingAs($professional->user)
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => null])
            ->assertSessionHas('toast.message', 'La cirugía quedó como Programada.');
        $this->assertNull($surgery->fresh()->attendance);
    }

    public function test_unmarked_scheduled_surgery_shows_past_one_day_after_start(): void
    {
        $this->travelTo(Carbon::parse('2026-11-24 10:00:00'));
        $surgery = $this->scheduledAt(now()->subHours(2));
        $this->assertSame('Programada', $surgery->fresh()->statusLabel());

        $this->travelTo(Carbon::parse('2026-11-25 07:59:59'));
        $this->assertSame('Programada', $surgery->fresh()->statusLabel());

        $this->travelTo(Carbon::parse('2026-11-25 08:00:00'));
        $this->assertSame('Pasada', $surgery->fresh()->statusLabel());
        $this->assertSame(SurgeryStatus::Scheduled, $surgery->fresh()->status);

        $this->actingAs($this->makeAdmin())
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'attended'])
            ->assertSessionHas('toast.message', 'La cirugía quedó como Atendida.');
        $this->actingAs($this->makeAdmin())
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => null])
            ->assertSessionHas('toast.message', 'La cirugía quedó como Pasada.');
    }

    public function test_staff_marks_any_past_surgery(): void
    {
        $surgery = $this->scheduledAt(now()->subDays(3));

        $this->actingAs($this->makeAdmin())
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'absent'])
            ->assertSessionHasNoErrors();

        $this->assertSame('absent', $surgery->fresh()->attendance?->value);
        $this->assertSame('absent', $surgery->fresh()->toArray()['attendance']);
    }

    public function test_future_or_unscheduled_surgery_cannot_be_marked(): void
    {
        $admin = $this->makeAdmin();
        $future = $this->scheduledAt(now()->addHour());
        $toSchedule = Surgery::factory()->toSchedule()->create();
        $pending = Surgery::factory()->create();

        foreach ([$future, $toSchedule, $pending] as $surgery) {
            $this->actingAs($admin)
                ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'attended'])
                ->assertSessionHasErrors('attendance');
            $this->assertNull($surgery->fresh()->attendance);
        }
    }

    public function test_invalid_or_missing_value_is_rejected(): void
    {
        $admin = $this->makeAdmin();
        $surgery = $this->scheduledAt(now()->subHour());

        $this->actingAs($admin)
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'completed'])
            ->assertSessionHasErrors('attendance');
        $this->actingAs($admin)
            ->patch("/surgeries/{$surgery->id}/attendance", [])
            ->assertSessionHasErrors('attendance');

        $this->assertNull($surgery->fresh()->attendance);
    }

    public function test_only_staff_or_the_requesting_professional_can_mark(): void
    {
        $owner = $this->makeProfessional();
        $other = $this->makeProfessional();
        $patient = $this->makePatient();
        $surgery = $this->scheduledAt(now()->subHour(), $owner);

        // 403 → RejectedRequestHandler redirects to the actor's landing.
        $this->actingAs($other->user)
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'attended'])
            ->assertRedirect('/profesional');
        $this->actingAs($patient->user)
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'attended'])
            ->assertRedirect('/paciente');

        $this->assertNull($surgery->fresh()->attendance);

        $this->actingAs($this->makeSuperAdmin())
            ->patch("/surgeries/{$surgery->id}/attendance", ['attendance' => 'attended'])
            ->assertSessionHasNoErrors();
        $this->assertSame('attended', $surgery->fresh()->attendance?->value);
    }

    private function scheduledAt(Carbon $start, ?Professional $professional = null): Surgery
    {
        $professional ??= $this->makeProfessional();

        return Surgery::factory()->scheduled($start)->create([
            'professional_id' => $professional->id,
        ]);
    }
}
