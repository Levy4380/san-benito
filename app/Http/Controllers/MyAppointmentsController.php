<?php

namespace App\Http\Controllers;

use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyAppointmentsController extends Controller
{
    public function index(Request $request, AppointmentService $appointmentService): Response
    {
        $patient = $request->user()->patient;

        abort_unless($patient, 403);

        return Inertia::render('appointments/my-appointments', [
            'appointments' => $appointmentService->upcomingForPatient($patient),
        ]);
    }
}
