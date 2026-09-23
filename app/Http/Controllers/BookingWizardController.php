<?php

namespace App\Http\Controllers;

use App\Services\BookingWizardService;
use App\Services\PatientService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingWizardController extends Controller
{
    public function index(Request $request, BookingWizardService $wizard, PatientService $patients): Response
    {
        $coverage = $request->string('coverage')->toString();
        $coverage = in_array($coverage, ['particular', 'health_insurance'], true) ? $coverage : null;
        $specialtyId = $request->filled('specialty_id') ? $request->integer('specialty_id') : null;
        $doctorId = $request->filled('doctor_id') ? $request->integer('doctor_id') : null;
        $date = $request->filled('date') ? $request->string('date')->toString() : null;

        return Inertia::render('Patient/Book', $wizard->pageData(
            $coverage,
            $specialtyId,
            $doctorId,
            $date,
            $patients->forUser($request->user()),
        ));
    }
}
