<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAgendaSettingsRequest;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAgendaSettingsController extends Controller
{
    public function edit(Request $request, DoctorService $doctors): Response
    {
        $doctor = $doctors->forUser($request->user());

        return Inertia::render('Settings/Agenda', [
            'slot_duration_minutes' => $doctor->slot_duration_minutes,
        ]);
    }

    public function update(
        UpdateAgendaSettingsRequest $request,
        DoctorService $doctors,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());
        $doctors->updateSlotDuration($doctor, (int) $request->validated('slot_duration_minutes'));

        return back()->with('toast', [
            'message' => 'Guardaste la duración de turno.',
            'variant' => 'ok',
        ]);
    }
}
