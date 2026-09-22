<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminPatientRequest;
use App\Http\Requests\Admin\UpdatePatientHealthInsuranceRequest;
use App\Models\Patient;
use App\Services\DoctorPatientService;
use App\Services\HealthInsuranceService;
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

    public function create(HealthInsuranceService $healthInsurances): Response
    {
        return Inertia::render('Admin/PatientCreate', [
            'healthInsurances' => $healthInsurances->options(),
        ]);
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

    public function show(Patient $patient, DoctorPatientService $links, HealthInsuranceService $healthInsurances): Response
    {
        $profile = $links->profile($patient);

        return Inertia::render('Admin/UserPatient', [
            'patient' => $profile,
            'healthInsuranceId' => $profile->healthInsurances->first()?->id,
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }

    public function updateHealthInsurance(
        UpdatePatientHealthInsuranceRequest $request,
        Patient $patient,
        PatientService $patients,
    ): RedirectResponse {
        $patients->syncHealthInsurance($patient, $request->validated('health_insurance_id'));

        return redirect()
            ->route('admin.patients.show', $patient)
            ->with('toast', [
                'message' => 'Actualizaste la obra social.',
                'variant' => 'ok',
            ]);
    }
}
