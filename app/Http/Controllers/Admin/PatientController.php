<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminPatientRequest;
use App\Models\Patient;
use App\Services\DoctorPatientService;
use App\Services\PatientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function index(Request $request, PatientService $patients): Response
    {
        $name = $request->input('name');
        $email = $request->input('email');

        return Inertia::render('Admin/Patients', [
            'patients' => $patients->list(
                is_string($name) ? $name : null,
                is_string($email) ? $email : null,
            ),
            'filters' => [
                'name' => is_string($name) ? $name : '',
                'email' => is_string($email) ? $email : '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/PatientCreate');
    }

    public function store(StoreAdminPatientRequest $request, PatientService $patients): RedirectResponse
    {
        $patients->register($request->validated());

        return redirect()
            ->route('admin.patients.index')
            ->with('toast', [
                'message' => 'Creaste el paciente.',
                'variant' => 'ok',
            ]);
    }

    public function show(Patient $patient, DoctorPatientService $links): Response
    {
        return Inertia::render('Admin/UserPatient', [
            'patient' => $links->profile($patient),
        ]);
    }
}
