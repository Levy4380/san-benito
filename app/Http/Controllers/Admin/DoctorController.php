<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDoctorRequest;
use App\Services\DoctorSearchService;
use App\Services\DoctorService;
use App\Services\HealthInsuranceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
    public function index(Request $request, DoctorSearchService $search): Response
    {
        $specialty = $search->parseSpecialtyFilter($request->input('specialty_id'));
        $name = $request->input('q');

        return Inertia::render('Admin/Doctors', [
            'doctors' => $search->search($specialty['id'], is_string($name) ? $name : null, true),
            'specialties' => $search->specialties(),
            'filters' => [
                'specialty_id' => $specialty['value'],
                'q' => is_string($name) ? $name : '',
            ],
        ]);
    }

    public function create(DoctorSearchService $search, HealthInsuranceService $healthInsurances): Response
    {
        return Inertia::render('Admin/DoctorCreate', [
            'specialties' => $search->specialties(),
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }

    public function store(StoreDoctorRequest $request, DoctorService $doctors): RedirectResponse
    {
        $doctors->create($request->validated());

        return redirect()
            ->route('admin.doctors.index')
            ->with('toast', [
                'message' => 'Creaste al profesional.',
                'variant' => 'ok',
            ]);
    }
}
