<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAgendaSettingsRequest;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalAgendaSettingsController extends Controller
{
    public function edit(Request $request, ProfessionalService $professionals): Response
    {
        $professional = $professionals->forUser($request->user());

        return Inertia::render('Settings/Agenda', [
            'slot_duration_minutes' => $professional->slot_duration_minutes,
        ]);
    }

    public function update(
        UpdateAgendaSettingsRequest $request,
        ProfessionalService $professionals,
    ): RedirectResponse {
        $professional = $professionals->forUser($request->user());
        $professionals->updateSlotDuration($professional, (int) $request->validated('slot_duration_minutes'));

        return back()->with('toast', [
            'message' => 'Guardaste la duración de turno.',
            'variant' => 'ok',
        ]);
    }
}
