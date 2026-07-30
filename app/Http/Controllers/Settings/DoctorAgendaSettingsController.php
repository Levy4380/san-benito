<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\GenerateDoctorAgendaRequest;
use App\Http\Requests\Settings\UpdateDoctorAgendaSettingsRequest;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAgendaSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        return Inertia::render('settings/agenda', [
            'doctor' => [
                'id' => $doctor->id,
                'slot_duration_minutes' => $doctor->slot_duration_minutes,
                'weekly_availability' => $doctor->weekly_availability ?? [],
            ],
        ]);
    }

    public function update(
        UpdateDoctorAgendaSettingsRequest $request,
        DoctorService $doctorService,
    ): RedirectResponse {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $validated = $request->validated();

        $doctorService->updateAgendaSettings(
            $doctor,
            (int) $validated['slot_duration_minutes'],
            array_key_exists('weekly_availability', $validated)
                ? ($validated['weekly_availability'] ?? [])
                : null,
        );

        return back()->with('success', 'Configuración de agenda actualizada.');
    }

    public function generate(
        GenerateDoctorAgendaRequest $request,
        AppointmentService $appointmentService,
    ): RedirectResponse {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $bands = $doctor->weekly_availability ?? [];

        if ($bands === []) {
            throw ValidationException::withMessages([
                'weekly_availability' => 'Primero guardá al menos una franja semanal.',
            ]);
        }

        $month = $request->validated('target') === 'next'
            ? now()->startOfMonth()->addMonth()
            : now()->startOfMonth();

        $result = $appointmentService->generateMonthFromWeeklyTemplate($doctor, $month);

        return back()->with(
            'success',
            sprintf(
                'Se crearon %d turnos (%d omitidos por solape o pasados).',
                $result['created'],
                $result['skipped'],
            ),
        );
    }
}
