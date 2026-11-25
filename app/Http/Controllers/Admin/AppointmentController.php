<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminAppointmentService;
use App\Support\SearchCriteria;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request, AdminAppointmentService $appointments): Response
    {
        $by = SearchCriteria::appointmentBy($request, true);
        $filters = [
            'professional_id' => $request->integer('professional_id') ?: null,
            'patient_id' => $request->integer('patient_id') ?: null,
            'specialty_id' => $request->integer('specialty_id') ?: null,
            'date' => $request->filled('date') ? $request->string('date')->toString() : null,
        ];

        return Inertia::render('Admin/Appointments', [
            'appointments' => $by === null
                ? SearchCriteria::emptyPaginator($request)
                : $appointments->paginate($filters),
            'filters' => $filters,
            'by' => $by,
            ...$appointments->filterOptions(),
        ]);
    }
}
