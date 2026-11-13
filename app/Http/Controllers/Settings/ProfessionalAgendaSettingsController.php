<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAgendaSettingsRequest;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;

class ProfessionalAgendaSettingsController extends Controller
{
    public function edit(): RedirectResponse
    {
        return redirect()->route('profile.edit');
    }

    public function update(
        UpdateAgendaSettingsRequest $request,
        ProfessionalService $professionals,
    ): RedirectResponse {
        $professional = $professionals->forUser($request->user());
        $professionals->updateSlotDuration($professional, (int) $request->validated('slot_duration_minutes'));

        return redirect()->route('profile.edit')->with('toast', [
            'message' => 'Guardaste la duración de turno.',
            'variant' => 'ok',
        ]);
    }
}
