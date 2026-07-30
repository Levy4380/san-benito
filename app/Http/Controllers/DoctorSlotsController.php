<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Services\AppointmentService;
use Inertia\Inertia;
use Inertia\Response;

class DoctorSlotsController extends Controller
{
    public function index(Doctor $doctor, AppointmentService $appointmentService): Response
    {
        $doctor->load(['user', 'specialty']);

        return Inertia::render('doctors/slots', [
            'doctor' => $doctor,
            'slots' => $appointmentService->availableSlotsForDoctor($doctor),
        ]);
    }
}
