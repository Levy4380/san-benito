<?php

namespace App\Http\Controllers;

use App\Services\DoctorSearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorSearchController extends Controller
{
    public function index(Request $request, DoctorSearchService $search): Response
    {
        $specialty = $search->parseSpecialtyFilter($request->input('specialty_id'));
        $name = $request->input('q');

        return Inertia::render('Doctors/Index', [
            'doctors' => $search->search($specialty['id'], is_string($name) ? $name : null, true),
            'specialties' => $search->specialties(),
            'filters' => [
                'specialty_id' => $specialty['value'],
                'q' => is_string($name) ? $name : '',
            ],
        ]);
    }
}
