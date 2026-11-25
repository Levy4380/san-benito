<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Services\HealthInsuranceService;
use Illuminate\Http\JsonResponse;

class ProfessionalProfileController extends Controller
{
    public function healthInsurances(Professional $professional, HealthInsuranceService $healthInsurances): JsonResponse
    {
        return response()->json([
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }
}
