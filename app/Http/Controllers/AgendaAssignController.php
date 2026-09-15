<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignAppointmentRequest;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;

class AgendaAssignController extends Controller
{
    public function store(
        AssignAppointmentRequest $request,
        DoctorService $doctors,
        AppointmentService $appointments,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());

        $startsAt = $request->validated('starts_at');

        $appointments->assign(
            $request->user(),
            $doctor,
            (int) $request->validated('patient_id'),
            $startsAt,
            (int) $request->validated('specialty_id'),
        );

        return redirect()
            ->route('agenda', ['date' => Carbon::parse($startsAt)->toDateString()])
            ->with('toast', [
                'message' => 'Asignaste el turno.',
                'variant' => 'ok',
            ]);
    }
}
