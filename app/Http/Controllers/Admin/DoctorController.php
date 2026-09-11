<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDoctorRequest;
use App\Services\DoctorSearchService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
    public function index(DoctorSearchService $search): Response
    {
        return Inertia::render('Admin/Doctors', [
            'doctors' => $search->search(null, null, true),
            'specialties' => $search->specialties(),
        ]);
    }

    public function store(StoreDoctorRequest $request, DoctorService $doctors): RedirectResponse
    {
        $doctors->create($request->validated());

        return back()->with('toast', [
            'message' => 'Creaste al profesional.',
            'variant' => 'ok',
        ]);
    }
}
