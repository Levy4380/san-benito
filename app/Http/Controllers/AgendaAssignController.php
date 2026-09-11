<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignAppointmentRequest;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;

class AgendaAssignController extends Controller
{
    public function store(
        AssignAppointmentRequest $request,
        DoctorService $doctors,
        AppointmentService $appointments,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());

        $appointments->assign(
            $request->user(),
            $doctor,
            (int) $request->validated('patient_id'),
            $request->validated('starts_at'),
        );

        return back()->with('toast', [
            'message' => 'Asignaste el turno.',
            'variant' => 'ok',
        ]);
    }
}
