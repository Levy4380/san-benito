<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDoctorAppointmentRequest;
use App\Models\Doctor;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;

class DoctorAppointmentController extends Controller
{
    public function store(
        StoreDoctorAppointmentRequest $request,
        Doctor $doctor,
        AppointmentService $appointments,
    ): RedirectResponse {
        $appointment = $appointments->assignAsStaff(
            $doctor,
            (int) $request->validated('patient_id'),
            $request->validated('starts_at'),
            (int) $request->validated('specialty_id'),
        )->load('patient');

        return redirect()
            ->route('doctors.slots', [
                'doctor' => $doctor->id,
                'date' => $appointment->starts_at->toDateString(),
                'specialty_id' => $appointment->specialty_id,
            ])
            ->with('toast', [
                'message' => 'Agendaste el turno de '.$appointment->patient->name.' a las '.$appointment->starts_at->format('H:i').'.',
                'variant' => 'ok',
            ]);
    }
}
