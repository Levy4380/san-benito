<?php

namespace App\Http\Controllers;

use App\Http\Requests\LinkPatientRequest;
use App\Services\ProfessionalPatientService;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyPatientsController extends Controller
{
    public function index(
        Request $request,
        ProfessionalService $professionals,
        ProfessionalPatientService $links,
    ): Response {
        $professional = $professionals->forUser($request->user());
        $professional->load(['specialties', 'healthInsurances']);
        $term = $request->string('q')->toString();
        $insurance = $links->parseOwnedFilter(
            $request->input('health_insurance_id'),
            $professional->healthInsurances->pluck('id'),
        );
        $specialty = $links->parseOwnedFilter(
            $request->input('specialty_id'),
            $professional->specialties->pluck('id'),
        );

        return Inertia::render('Professional/MyPatients', [
            'patients' => $links->patientsFor($professional, $insurance['id'], $specialty['id']),
            'candidates' => $term !== ''
                ? $links->searchRegisteredPatients($term, $professional, $insurance['id'], $specialty['id'])
                : collect(),
            'healthInsurances' => $professional->healthInsurances->map(fn ($insurance) => [
                'id' => $insurance->id,
                'name' => $insurance->name,
            ])->values(),
            'specialties' => $professional->specialties->map(fn ($specialty) => [
                'id' => $specialty->id,
                'name' => $specialty->name,
            ])->values(),
            'filters' => [
                'q' => $term,
                'health_insurance_id' => $insurance['value'],
                'specialty_id' => $specialty['value'],
            ],
        ]);
    }

    public function store(
        LinkPatientRequest $request,
        ProfessionalService $professionals,
        ProfessionalPatientService $links,
    ): RedirectResponse {
        $professional = $professionals->forUser($request->user());
        $patient = $links->findPatient((int) $request->validated('patient_id'));
        $links->link($professional, $patient);

        return back()->with('toast', [
            'message' => 'Vinculaste al paciente.',
            'variant' => 'ok',
        ]);
    }
}
