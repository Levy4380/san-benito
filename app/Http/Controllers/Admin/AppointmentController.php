<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use App\Services\PatientService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(
        Request $request,
        AppointmentService $appointmentService,
        DoctorService $doctorService,
        PatientService $patientService
    ): Response {
        return Inertia::render('admin/appointments', [
            'appointments' => $appointmentService->listForAdmin([
                'doctor_id' => $request->input('doctor_id'),
                'patient_id' => $request->input('patient_id'),
                'date' => $request->input('date'),
            ]),
            'doctors' => $doctorService->listWithUser(),
            'patients' => $patientService->listWithUser(),
            'filters' => [
                'doctor_id' => $request->input('doctor_id'),
                'patient_id' => $request->input('patient_id'),
                'date' => $request->input('date'),
            ],
        ]);
    }
}
