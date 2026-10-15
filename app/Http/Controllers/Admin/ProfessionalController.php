<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProfessionalRequest;
use App\Services\HealthInsuranceService;
use App\Services\ProfessionalSearchService;
use App\Services\ProfessionalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalController extends Controller
{
    public function index(Request $request, ProfessionalSearchService $search): Response
    {
        $specialty = $search->parseSpecialtyFilter($request->input('specialty_id'));
        $name = $request->input('q');

        $professionals = $search->search($specialty['id'], is_string($name) ? $name : null, true);
        $professionals->load('healthInsurances');

        return Inertia::render('Admin/Professionals', [
            'professionals' => $professionals,
            'specialties' => $search->specialties(),
            'filters' => [
                'specialty_id' => $specialty['value'],
                'q' => is_string($name) ? $name : '',
            ],
        ]);
    }

    public function create(ProfessionalSearchService $search, HealthInsuranceService $healthInsurances): JsonResponse
    {
        return response()->json([
            'specialties' => $search->specialties(),
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }

    public function store(StoreProfessionalRequest $request, ProfessionalService $professionals): RedirectResponse
    {
        $professionals->create($request->validated());

        return redirect()
            ->route('admin.professionals.index')
            ->with('toast', [
                'message' => 'Creaste al profesional.',
                'variant' => 'ok',
            ]);
    }
}
