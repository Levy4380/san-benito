<?php

namespace App\Http\Controllers;

use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(Request $request, AppointmentService $appointmentService): Response
    {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        return Inertia::render('doctor/agenda', [
            'doctor' => $doctor->only(['id', 'slot_duration_minutes']),
            'appointments' => $appointmentService->upcomingForDoctor($doctor),
        ]);
    }
}
