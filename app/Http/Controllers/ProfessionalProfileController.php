<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Services\HealthInsuranceService;
use App\Services\ProfessionalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function healthInsurances(Request $request, Professional $professional, HealthInsuranceService $healthInsurances): Response|JsonResponse
    {
        $options = $healthInsurances->options();

        if ($request->wantsJson()) {
            return response()->json([
                'healthInsurances' => $options,
            ]);
        }

        return Inertia::render('Professionals/HealthInsurances', [
            'professional' => $professional->load(['user', 'specialties', 'healthInsurances']),
            'healthInsurances' => $options,
        ]);
    }
}
