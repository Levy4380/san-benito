<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;

class AppointmentCancellationController extends Controller
{
    public function store(Appointment $appointment, AppointmentService $appointmentService): RedirectResponse
    {
        $this->authorize('cancel', $appointment);

        $appointmentService->cancel($appointment);

        return back()->with('success', 'Turno cancelado. El horario volvió a estar disponible.');
    }
}
