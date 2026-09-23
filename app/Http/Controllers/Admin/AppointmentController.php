<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminAppointmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request, AdminAppointmentService $appointments): Response
    {
        $filters = [
            'doctor_id' => $request->integer('doctor_id') ?: null,
            'patient_id' => $request->integer('patient_id') ?: null,
            'specialty_id' => $request->integer('specialty_id') ?: null,
            'date' => $request->filled('date') ? $request->string('date')->toString() : null,
        ];

        return Inertia::render('Admin/Appointments', [
            'appointments' => $appointments->paginate($filters),
            'filters' => $filters,
            ...$appointments->filterOptions(),
        ]);
    }
}
