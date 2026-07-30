<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDoctorRequest;
use App\Models\Patient;
use App\Models\Specialty;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
    public function index(DoctorService $doctorService): Response
    {
        return Inertia::render('admin/doctors', [
            'doctors' => $doctorService->listWithRelations(),
            'specialties' => Specialty::query()->orderBy('name')->get(),
            'patients' => Patient::query()
                ->with('user')
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function store(StoreDoctorRequest $request, DoctorService $doctorService): RedirectResponse
    {
        $doctorService->createDoctor($request->validated());

        return back()->with('success', 'Doctor creado correctamente.');
    }
}
