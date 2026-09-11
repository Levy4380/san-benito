<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Services\DoctorPatientService;
use App\Services\DoctorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyPatientProfileController extends Controller
{
    public function show(
        Request $request,
        Patient $patient,
        DoctorService $doctors,
        DoctorPatientService $links,
    ): Response {
        $doctor = $doctors->forUser($request->user());

        if (! $links->isLinked($doctor, $patient)) {
            abort(403);
        }

        return Inertia::render('Doctor/PatientProfile', [
            'patient' => $links->profile($patient),
        ]);
    }
}
