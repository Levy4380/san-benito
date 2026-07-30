<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use App\Services\DoctorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorSearchController extends Controller
{
    public function index(Request $request, DoctorService $doctorService): Response
    {
        $name = $request->string('name')->toString() ?: null;
        $specialtyId = $request->integer('specialty_id') ?: null;

        return Inertia::render('doctors/index', [
            'doctors' => $doctorService->searchByName($name, $specialtyId),
            'specialties' => Specialty::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'name' => $name,
                'specialty_id' => $specialtyId,
            ],
        ]);
    }
}
