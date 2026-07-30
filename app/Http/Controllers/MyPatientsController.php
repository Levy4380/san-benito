<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDoctorPatientRequest;
use App\Models\Patient;
use App\Services\DoctorPatientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyPatientsController extends Controller
{
    public function index(Request $request, DoctorPatientService $doctorPatientService): Response
    {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $q = $request->string('q')->toString();
        $linkQ = $request->string('link_q')->toString();

        return Inertia::render('doctor/my-patients', [
            'patients' => $doctorPatientService->listForDoctor($doctor, $q),
            'candidates' => $doctorPatientService->searchCandidates($linkQ),
            'filters' => [
                'q' => $q !== '' ? $q : null,
                'link_q' => $linkQ !== '' ? $linkQ : null,
            ],
        ]);
    }

    public function store(
        StoreDoctorPatientRequest $request,
        DoctorPatientService $doctorPatientService,
    ): RedirectResponse {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $patient = Patient::query()->findOrFail($request->validated('patient_id'));
        $doctorPatientService->link($doctor, $patient);

        return back()->with('success', 'Paciente vinculado correctamente.');
    }
}
