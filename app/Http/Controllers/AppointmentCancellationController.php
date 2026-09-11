<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AppointmentCancellationController extends Controller
{
    public function destroy(Request $request, Appointment $appointment, AppointmentService $appointments): RedirectResponse
    {
        $this->authorize('cancel', $appointment);

        $appointments->cancel($appointment);

        return back()->with('toast', [
            'message' => 'Cancelaste el turno.',
            'variant' => 'ok',
        ]);
    }
}
