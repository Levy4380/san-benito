<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\ProgramAvailabilityWindowsRequest;
use App\Services\AgendaService;
use App\Services\AvailabilityWindowService;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaProgramController extends Controller
{
    public function create(Request $request, ProfessionalService $professionals, AgendaService $agenda): Response
    {
        $professional = $professionals->forUser($request->user());

        return Inertia::render('Professional/Program', [
            'professional' => $professional->load(['user', 'specialties']),
            'tones' => $agenda->tonesForNearbyMonths($professional),
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
