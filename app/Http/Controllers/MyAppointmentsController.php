<?php

namespace App\Http\Controllers;

use App\Services\AppointmentService;
use App\Services\PatientService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyAppointmentsController extends Controller
{
    public function index(Request $request, PatientService $patients, AppointmentService $appointments): Response
    {
        $patient = $patients->forUser($request->user());

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments->upcomingForPatient($patient),
            'today' => now()->toDateString(),
            'now' => now()->format('Y-m-d H:i:s'),
        ]);
    }

    public function history(Request $request, PatientService $patients, AppointmentService $appointments): Response
    {
        $patient = $patients->forUser($request->user());

        return Inertia::render('Appointments/History', [
            'appointments' => $appointments->pastForPatient($patient),
        ]);
    }
}
