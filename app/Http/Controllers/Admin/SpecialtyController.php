<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSpecialtyRequest;
use App\Http\Requests\Admin\UpdateSpecialtyRequest;
use App\Models\Specialty;
use App\Services\SpecialtyService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SpecialtyController extends Controller
{
    public function index(SpecialtyService $specialties): Response
    {
        return Inertia::render('Admin/Specialties', [
            'specialties' => $specialties->list(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/SpecialtyCreate');
    }

    public function edit(Specialty $specialty, SpecialtyService $specialties): Response
    {
        return Inertia::render('Admin/SpecialtyEdit', $specialties->editForm($specialty));
    }

    public function store(StoreSpecialtyRequest $request, SpecialtyService $specialties): RedirectResponse
    {
        $specialties->create($request->validated());

        return redirect()
            ->route('admin.settings.specialties.index')
            ->with('toast', [
                'message' => 'Creaste la especialidad.',
                'variant' => 'ok',
            ]);
    }

    public function update(UpdateSpecialtyRequest $request, Specialty $specialty, SpecialtyService $specialties): RedirectResponse
    {
        $specialties->update($specialty, $request->validated());

        return redirect()
            ->route('admin.settings.specialties.index')
            ->with('toast', [
                'message' => 'Actualizaste la especialidad.',
                'variant' => 'ok',
            ]);
    }

    public function destroy(Specialty $specialty, SpecialtyService $specialties): RedirectResponse
    {
        $specialties->delete($specialty);

        return back()->with('toast', [
            'message' => 'Eliminaste la especialidad.',
            'variant' => 'ok',
        ]);
    }
}
