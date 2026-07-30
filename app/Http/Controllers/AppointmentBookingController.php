<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainException;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AppointmentBookingController extends Controller
{
    public function store(Request $request, Appointment $appointment, AppointmentService $appointmentService): RedirectResponse
    {
        $this->authorize('book', $appointment);

        $patient = $request->user()->patient;

        abort_unless($patient, 403);

        try {
            $appointmentService->book($appointment, $patient);
        } catch (DomainException $e) {
            return back()->withErrors(['appointment' => $e->getMessage()]);
        }

        return redirect()
            ->route('my-appointments.index')
            ->with('success', 'Turno reservado correctamente.');
    }
}
