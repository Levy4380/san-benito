<?php

namespace App\Http\Controllers;

use App\Http\Requests\LinkPatientRequest;
use App\Services\DoctorPatientService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyPatientsController extends Controller
{
    public function index(
        Request $request,
        DoctorService $doctors,
        DoctorPatientService $links,
    ): Response {
        $doctor = $doctors->forUser($request->user());
        $term = $request->string('q')->toString();

        return Inertia::render('Doctor/MyPatients', [
            'patients' => $links->patientsFor($doctor),
            'candidates' => $term !== '' ? $links->searchRegisteredPatients($term) : collect(),
            'filters' => ['q' => $term],
        ]);
    }

    public function store(
        LinkPatientRequest $request,
        DoctorService $doctors,
        DoctorPatientService $links,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());
        $patient = $links->findPatient((int) $request->validated('patient_id'));
        $links->link($doctor, $patient);

        return back()->with('toast', [
            'message' => 'Vinculaste al paciente.',
            'variant' => 'ok',
        ]);
    }
}
