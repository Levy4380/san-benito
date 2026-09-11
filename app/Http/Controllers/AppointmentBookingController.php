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
        $appointments->book($request->user(), $doctor, $request->validated('starts_at'));

        return redirect()->route('my-appointments')->with('toast', [
            'message' => 'Reservaste el turno.',
            'variant' => 'ok',
        ]);
    }
}
