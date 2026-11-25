<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\RescheduleAppointmentRequest;
use App\Models\Appointment;
use App\Services\AgendaService;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** Reprogramar turno (d51): staff any appointment (+ sobreturno), the professional their own agenda. */
class AppointmentRescheduleController extends Controller
{
    public function options(Request $request, Appointment $appointment, AgendaService $agenda): JsonResponse
    {
        $this->authorize('reschedule', $appointment);

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'month' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return response()->json($agenda->rescheduleOptions(
            $appointment,
            $validated['date'] ?? null,
            $validated['month'] ?? null,
            Permission::AppointmentsReschedule->allows($request->user()),
        ));
    }

    public function update(RescheduleAppointmentRequest $request, Appointment $appointment, AppointmentService $appointments): RedirectResponse
    {
        $result = $appointments->reschedule(
            $appointment,
            (string) $request->validated('starts_at'),
            Permission::AppointmentsReschedule->allows($request->user()),
        );

        $moved = $result['appointment']->loadMissing('patient');

        return back()->with('toast', [
            'message' => sprintf(
                $result['overbook'] ? 'Reprogramaste el turno de %s como sobreturno el %s a las %s.' : 'Reprogramaste el turno de %s al %s a las %s.',
                $moved->patient->name,
                $moved->starts_at->format('d/m'),
                $moved->starts_at->format('H:i'),
            ),
            'variant' => 'ok',
        ]);
    }
}
