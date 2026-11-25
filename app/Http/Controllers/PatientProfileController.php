<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Patient;
use App\Services\HealthInsuranceService;
use App\Services\ProfessionalPatientService;
use App\Services\ProfessionalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ficha de paciente (JSON) para el modal. Staff con `patients.catalog.view` recibe además el
 * catálogo de obras sociales para editarla; el professional solo ve pacientes vinculados.
 */
class PatientProfileController extends Controller
{
    public function show(
        Request $request,
        Patient $patient,
        ProfessionalPatientService $links,
        ProfessionalService $professionals,
        HealthInsuranceService $healthInsurances,
    ): JsonResponse {
        $profile = $links->profile($patient);

        if (Permission::PatientsCatalogView->allows($request->user())) {
            return response()->json([
                'patient' => $profile,
                'healthInsuranceId' => $profile->healthInsurances->first()?->id,
                'healthInsurances' => $healthInsurances->options(),
            ]);
        }

        if (! $links->isLinked($professionals->forUser($request->user()), $patient)) {
            abort(403);
        }

        return response()->json(['patient' => $profile]);
    }
}
