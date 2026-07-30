<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateDoctorAgendaSettingsRequest;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAgendaSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        return Inertia::render('settings/agenda', [
            'doctor' => $doctor->only(['id', 'slot_duration_minutes']),
        ]);
    }

    public function update(
        UpdateDoctorAgendaSettingsRequest $request,
        DoctorService $doctorService,
    ): RedirectResponse {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $doctorService->updateSlotDuration(
            $doctor,
            (int) $request->validated('slot_duration_minutes'),
        );

        return back()->with('success', 'Duración de turnos actualizada.');
    }
}
