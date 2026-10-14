<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Services\ProfessionalPatientService;
use App\Services\ProfessionalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyPatientProfileController extends Controller
{
    public function show(
        Request $request,
        Patient $patient,
        ProfessionalService $professionals,
        ProfessionalPatientService $links,
    ): Response {
        $professional = $professionals->forUser($request->user());

        if (! $links->isLinked($professional, $patient)) {
            abort(403);
        }

        return Inertia::render('Professional/PatientProfile', [
            'patient' => $links->profile($patient),
        ]);
    }
}
