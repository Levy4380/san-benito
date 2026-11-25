<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProgramAvailabilityWindowsRequest;
use App\Http\Requests\StoreAvailabilityWindowRequest;
use App\Models\AvailabilityWindow;
use App\Models\Professional;
use App\Services\AgendaService;
use App\Services\AvailabilityWindowService;
use App\Support\ProfessionalCatalogReturn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalWindowController extends Controller
{
    public function createProgram(Request $request, Professional $professional, AgendaService $agenda): Response
    {
        $today = now()->toDateString();
        $monthInput = $request->string('month')->toString();
        $month = preg_match('/^\d{4}-\d{2}-\d{2}$/', $monthInput) === 1
            ? Carbon::parse($monthInput)
            : now();

        if ($month->copy()->endOfMonth()->toDateString() < $today) {
            $month = now();
        }

        $calendar = $agenda->programCalendar($professional, $month);

        return Inertia::render('Professional/Program', [
            'professional' => $professional->load(['user', 'specialties']),
            'month' => $month->copy()->startOfMonth()->toDateString(),
            'today' => $today,
            'tones' => $calendar['tones'],
            'blockedDates' => $calendar['blockedDates'],
            'submitUrl' => route('admin.professionals.windows.program', $professional, absolute: false),
            'monthPath' => route('admin.professionals.program', $professional, absolute: false),
            'backHref' => ProfessionalCatalogReturn::href($professional, 'agenda'),
        ]);
    }

    public function store(
        StoreAvailabilityWindowRequest $request,
        Professional $professional,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $windows->assertOwnedBy($request->user(), $professional, Permission::AvailabilityCreate);
        $windows->createShortWindow($professional, $request->validated('starts_at'));

        return back()->with('toast', [
            'message' => 'Cargaste el sobreturno.',
            'variant' => 'ok',
        ]);
    }

    public function program(
        ProgramAvailabilityWindowsRequest $request,
        Professional $professional,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $windows->assertOwnedBy($request->user(), $professional, Permission::AvailabilityProgram);
        $data = $request->validated();

        $windows->program(
            $professional,
            $data['dates'],
            $data['ranges'],
            (bool) ($data['block_weekends'] ?? false),
        );

        return redirect()
            ->to(ProfessionalCatalogReturn::href($professional, 'agenda'))
            ->with('toast', [
                'message' => 'Programaste los horarios.',
                'variant' => 'ok',
            ]);
    }

    public function destroy(
        Professional $professional,
        AvailabilityWindow $window,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        abort_unless($window->professional_id === $professional->id, 404);
        $this->authorize('delete', $window);
        $windows->delete($window);

        return back()->with('toast', [
            'message' => 'Borraste la franja.',
            'variant' => 'ok',
        ]);
    }
}
