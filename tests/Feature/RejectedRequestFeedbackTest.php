<?php

namespace Tests\Feature;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class RejectedRequestFeedbackTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_overlapping_program_is_logged_and_toasted(): void
    {
        $logged = [];
        Log::listen(function (MessageLogged $event) use (&$logged) {
            $logged[] = $event;
        });

        $doctor = $this->makeDoctor();
        $start = now()->next(Carbon::WEDNESDAY)->setTime(9, 0, 0);
        AvailabilityWindow::factory()->create([
            'doctor_id' => $doctor->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
        ]);

        $this->actingAs($doctor->user)
            ->from('/agenda/program')
            ->post('/agenda/program', [
                'dates' => [$start->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '10:00']],
                'block_weekends' => false,
            ])
            ->assertSessionHasErrors()
            ->assertSessionHas('toast', function (array $toast): bool {
                return ($toast['variant'] ?? null) === 'warn'
                    && str_contains((string) ($toast['message'] ?? ''), 'solapa');
            });

        $this->assertTrue(
            collect($logged)->contains(
                fn (MessageLogged $event) => $event->level === 'warning'
                    && str_contains($event->message, 'Pedido rechazado')
                    && str_contains($event->message, 'solapa')
            ),
            'Expected a warning log for the overlapping window rejection.',
        );
    }

    public function test_forbidden_requests_are_logged(): void
    {
        $logged = [];
        Log::listen(function (MessageLogged $event) use (&$logged) {
            $logged[] = $event;
        });

        $patient = $this->makePatient();

        $this->actingAs($patient->user)
            ->post('/agenda/program', [
                'dates' => [now()->toDateString()],
                'ranges' => [['start' => '09:00', 'end' => '10:00']],
                'block_weekends' => false,
            ])
            ->assertRedirect('/');

        $this->assertTrue(
            collect($logged)->contains(
                fn (MessageLogged $event) => $event->level === 'warning'
                    && str_contains($event->message, 'Pedido rechazado')
            ),
            'Expected a warning log for the forbidden request.',
        );
    }
}
