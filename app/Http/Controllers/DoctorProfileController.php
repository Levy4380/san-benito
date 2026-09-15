<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Services\DoctorSearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorProfileController extends Controller
{
    public function show(Request $request, Doctor $doctor, DoctorSearchService $search): Response
    {
        return Inertia::render('Doctors/Show', [
            'doctor' => $search->profile($doctor),
            'specialties' => $request->user()?->can('specialties.manage')
                ? $search->specialties()
                : [],
        ]);
    }
}
