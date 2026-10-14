<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminPatientRequest;
use App\Http\Requests\Admin\UpdatePatientHealthInsuranceRequest;
use App\Models\Patient;
use App\Services\HealthInsuranceService;
use App\Services\PatientService;
use App\Services\ProfessionalPatientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function index(Request $request, PatientService $patients, HealthInsuranceService $healthInsurances): Response
    {
        $term = $request->input('q');
        $insurance = $patients->parseHealthInsuranceFilter($request->input('health_insurance_id'));

        return Inertia::render('Admin/Patients', [
            'patients' => $patients->list(is_string($term) ? $term : null, $insurance['id']),
            'healthInsurances' => $healthInsurances->options(),
            'filters' => [
                'q' => is_string($term) ? $term : '',
                'health_insurance_id' => $insurance['value'],
            ],
        ]);
    }

    public function create(HealthInsuranceService $healthInsurances): JsonResponse
    {
        return response()->json([
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }

    public function store(StoreAdminPatientRequest $request, PatientService $patients): RedirectResponse
    {
        $data = $request->validated();
        $withAccount = (bool) $data['with_account'];
        unset($data['with_account']);

        if ($withAccount) {
            $patients->register($data);
        } else {
            $patients->createWithoutAccount($data);
        }

        return redirect()
            ->route('admin.patients.index')
            ->with('toast', [
                'message' => 'Creaste el paciente.',
                'variant' => 'ok',
            ]);
    }

    public function show(Patient $patient, ProfessionalPatientService $links, HealthInsuranceService $healthInsurances): Response
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
