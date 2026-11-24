<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Services\HealthInsuranceService;
use App\Services\ProfessionalSearchService;
use Illuminate\Http\JsonResponse;
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

    public function healthInsurances(Professional $professional, HealthInsuranceService $healthInsurances): JsonResponse
    {
        return response()->json([
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }
}
