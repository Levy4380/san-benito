<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\ProgramAvailabilityWindowsRequest;
use App\Services\AgendaService;
use App\Services\AvailabilityWindowService;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AgendaProgramController extends Controller
{
    public function create(Request $request, ProfessionalService $professionals, AgendaService $agenda): Response
    {
        $professional = $professionals->forUser($request->user());
        $monthInput = $request->string('month')->toString();
        $month = preg_match('/^\d{4}-\d{2}-\d{2}$/', $monthInput) === 1
            ? Carbon::parse($monthInput)
            : now();
        $calendar = $agenda->programCalendar($professional, $month);

        return Inertia::render('Professional/Program', [
            'professional' => $professional->load(['user', 'specialties']),
            'month' => $month->copy()->startOfMonth()->toDateString(),
            'tones' => $calendar['tones'],
            'blockedDates' => $calendar['blockedDates'],
        ]);
    }

    public function store(
        ProgramAvailabilityWindowsRequest $request,
        ProfessionalService $professionals,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $professional = $professionals->forUser($request->user());
        $windows->assertOwnedBy($request->user(), $professional, Permission::AvailabilityProgram);
        $data = $request->validated();

        $windows->program(
            $professional,
            $data['dates'],
            $data['ranges'],
            (bool) ($data['block_weekends'] ?? false),
        );

        return redirect()->route('professional.agenda')->with('toast', [
            'message' => 'Programaste las franjas.',
            'variant' => 'ok',
        ]);
    }
}
