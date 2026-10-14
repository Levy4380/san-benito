<?php

namespace App\Http\Controllers;

use App\Services\ProfessionalSearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalSearchController extends Controller
{
    public function index(Request $request, ProfessionalSearchService $search): Response
    {
        $specialty = $search->parseSpecialtyFilter($request->input('specialty_id'));
        $name = $request->input('q');

        return Inertia::render('Professionals/Index', [
            'professionals' => $search->search(
                $specialty['id'],
                is_string($name) ? $name : null,
                true,
                onlyWithSpecialties: true,
            ),
            'specialties' => $search->specialties(),
            'filters' => [
                'specialty_id' => $specialty['value'],
                'q' => is_string($name) ? $name : '',
            ],
        ]);
    }
}
