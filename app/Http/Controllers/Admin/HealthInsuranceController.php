<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHealthInsuranceRequest;
use App\Http\Requests\Admin\UpdateHealthInsuranceRequest;
use App\Models\HealthInsurance;
use App\Services\HealthInsuranceService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HealthInsuranceController extends Controller
{
    public function index(HealthInsuranceService $healthInsurances): Response
    {
        return Inertia::render('Admin/HealthInsurances', [
            'healthInsurances' => $healthInsurances->list(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/HealthInsuranceCreate');
    }

    public function edit(HealthInsurance $healthInsurance, HealthInsuranceService $healthInsurances): Response
    {
        return Inertia::render('Admin/HealthInsuranceEdit', $healthInsurances->editForm($healthInsurance));
    }

    public function store(StoreHealthInsuranceRequest $request, HealthInsuranceService $healthInsurances): RedirectResponse
    {
        $healthInsurances->create($request->validated());

        return redirect()
            ->route('admin.settings.health-insurances.index')
            ->with('toast', [
                'message' => 'Creaste la obra social.',
                'variant' => 'ok',
            ]);
    }

    public function update(UpdateHealthInsuranceRequest $request, HealthInsurance $healthInsurance, HealthInsuranceService $healthInsurances): RedirectResponse
    {
        $healthInsurances->update($healthInsurance, $request->validated());

        return redirect()
            ->route('admin.settings.health-insurances.index')
            ->with('toast', [
                'message' => 'Actualizaste la obra social.',
                'variant' => 'ok',
            ]);
    }

    public function destroy(HealthInsurance $healthInsurance, HealthInsuranceService $healthInsurances): RedirectResponse
    {
        $healthInsurances->delete($healthInsurance);

        return back()->with('toast', [
            'message' => 'Eliminaste la obra social.',
            'variant' => 'ok',
        ]);
    }
}
