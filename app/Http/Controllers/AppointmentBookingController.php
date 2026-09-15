<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookAppointmentRequest;
use App\Models\Doctor;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;

class AppointmentBookingController extends Controller
{
    public function store(BookAppointmentRequest $request, Doctor $doctor, AppointmentService $appointments): RedirectResponse
    {
        $appointment = $appointments->book(
            $request->user(),
            $doctor,
            $request->validated('starts_at'),
            (int) $request->validated('specialty_id'),
        );

        $wall = $appointment->starts_at->format('Y-m-d').' · '.$appointment->starts_at->format('H:i');

        return redirect()->route('my-appointments')->with('toast', [
            'message' => 'Reservaste el turno. '.$wall,
            'variant' => 'ok',
        ]);
    }
}
