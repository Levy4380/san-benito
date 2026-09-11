<?php

namespace App\Http\Controllers;

use App\Services\BookingWizardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingWizardController extends Controller
{
    public function index(Request $request, BookingWizardService $wizard): Response
    {
        $specialtyId = $request->filled('specialty_id') ? $request->integer('specialty_id') : null;
        $doctorId = $request->filled('doctor_id') ? $request->integer('doctor_id') : null;
        $date = $request->filled('date') ? $request->string('date')->toString() : null;

        return Inertia::render('Patient/Book', $wizard->pageData($specialtyId, $doctorId, $date));
    }
}
