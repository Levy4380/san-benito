<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignAppointmentRequest;
use App\Services\AgendaService;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AgendaAssignController extends Controller
{
    public function options(Request $request, DoctorService $doctors, AgendaService $agenda): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return response()->json($agenda->assignOptions(
            $doctors->forUser($request->user()),
            $validated['date'] ?? null,
        ));
    }

    public function store(
        AssignAppointmentRequest $request,
        DoctorService $doctors,
        AppointmentService $appointments,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());

        $appointment = $appointments->assign(
            $request->user(),
            $doctor,
            (int) $request->validated('patient_id'),
            $request->validated('starts_at'),
            (int) $request->validated('specialty_id'),
        )->loadMissing('patient');

        return back()->with('toast', [
            'message' => sprintf(
                'Asignaste el turno de %s el %s a las %s.',
                $appointment->patient->name,
                $appointment->starts_at->format('d/m'),
                $appointment->starts_at->format('H:i'),
            ),
            'variant' => 'ok',
        ]);
    }
}
