<?php

namespace App\Http\Controllers;

use App\Services\AppointmentService;
use App\Services\PatientService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientHomeController extends Controller
{
    public function index(Request $request, PatientService $patients, AppointmentService $appointments): Response
    {
        $patient = $patients->forUser($request->user());

        return Inertia::render('Patient/Home', [
            'upcoming' => $appointments->upcomingThisWeekForPatient($patient),
        ]);
    }
}
