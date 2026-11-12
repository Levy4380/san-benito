<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminPatientRequest;
use App\Http\Requests\Admin\UpdatePatientHealthInsuranceRequest;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Services\AgendaService;
use App\Services\HealthInsuranceService;
use App\Services\PatientService;
use App\Services\ProfessionalPatientService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        return Inertia::render('Admin/UserPatient', $this->profilePayload($patient, $links, $healthInsurances));
    }

    public function profile(Patient $patient, ProfessionalPatientService $links, HealthInsuranceService $healthInsurances): JsonResponse
    {
        return response()->json($this->profilePayload($patient, $links, $healthInsurances));
    }

    public function agenda(Request $request, Patient $patient, AgendaService $agenda): JsonResponse
    {
        $day = $request->string('date')->toString();
        $selectedDate = $day !== '' ? Carbon::parse($day)->toDateString() : now()->toDateString();

        return response()->json($agenda->patientDayTimeline($patient, $selectedDate));
    }

    /**
     * @return array{patient: Patient, healthInsuranceId: int|null, healthInsurances: Collection<int, HealthInsurance>}
     */
    private function profilePayload(Patient $patient, ProfessionalPatientService $links, HealthInsuranceService $healthInsurances): array
    {
        $profile = $links->profile($patient);

        return [
            'patient' => $profile,
            'healthInsuranceId' => $profile->healthInsurances->first()?->id,
            'healthInsurances' => $healthInsurances->options(),
        ];
    }

    public function updateHealthInsurance(
        UpdatePatientHealthInsuranceRequest $request,
        Patient $patient,
        PatientService $patients,
    ): RedirectResponse {
        $patients->syncHealthInsurance($patient, $request->validated('health_insurance_id'));

        return redirect()
            ->back(fallback: route('admin.patients.show', $patient))
            ->with('toast', [
                'message' => 'Actualizaste la obra social.',
                'variant' => 'ok',
            ]);
    }
}
