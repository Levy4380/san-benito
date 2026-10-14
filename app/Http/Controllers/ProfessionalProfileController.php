<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Services\HealthInsuranceService;
use App\Services\ProfessionalSearchService;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalProfileController extends Controller
{
    public function show(Professional $professional, ProfessionalSearchService $search): Response
    {
        return Inertia::render('Professionals/Show', [
            'professional' => $search->profile($professional),
        ]);
    }

    public function specialties(Professional $professional, ProfessionalSearchService $search): Response
    {
        return Inertia::render('Professionals/Specialties', [
            'professional' => $search->profile($professional),
            'specialties' => $search->specialties(),
        ]);
    }

    public function healthInsurances(Professional $professional, HealthInsuranceService $healthInsurances): Response
    {
        return Inertia::render('Professionals/HealthInsurances', [
            'professional' => $professional->load(['user', 'specialties', 'healthInsurances']),
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }
}
