<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Services\DoctorSearchService;
use Inertia\Inertia;
use Inertia\Response;

class DoctorProfileController extends Controller
{
    public function show(Doctor $doctor, DoctorSearchService $search): Response
    {
        return Inertia::render('Doctors/Show', [
            'doctor' => $search->profile($doctor),
        ]);
    }

    public function specialties(Doctor $doctor, DoctorSearchService $search): Response
    {
        return Inertia::render('Doctors/Specialties', [
            'doctor' => $search->profile($doctor),
            'specialties' => $search->specialties(),
        ]);
    }
}
