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
        $specialtyInput = $request->input('specialty_id');
        $name = $request->input('q');
        $filtered = $request->filled('specialty_id') || $request->filled('q');
        $specialtyId = ($specialtyInput === null || $specialtyInput === '' || $specialtyInput === 'all')
            ? null
            : (int) $specialtyInput;

        return Inertia::render('Doctors/Index', [
            'doctors' => $search->search($specialtyId, is_string($name) ? $name : null, $filtered),
            'specialties' => $search->specialties(),
            'filters' => [
                'specialty_id' => $specialtyInput ?? '',
                'q' => $name ?? '',
            ],
        ]);
    }
}
