<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClinicScheduleExceptionRequest;
use App\Http\Requests\Admin\UpdateClinicScheduleRequest;
use App\Models\ClinicScheduleException;
use App\Services\ClinicScheduleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClinicScheduleController extends Controller
{
    public function edit(ClinicScheduleService $clinic): Response
    {
        return Inertia::render('Admin/Clinic', [
            'clinic' => $clinic->share(),
        ]);
    }

    public function update(UpdateClinicScheduleRequest $request, ClinicScheduleService $clinic): RedirectResponse
    {
        $data = $request->validated();
        $clinic->update($data['open_days'], $data['opens_at'], $data['closes_at']);

        return back()->with('toast', [
            'message' => 'Guardaste el horario del sanatorio.',
            'variant' => 'ok',
        ]);
    }

    public function storeException(StoreClinicScheduleExceptionRequest $request, ClinicScheduleService $clinic): RedirectResponse
    {
        $data = $request->validated();
        $clinic->storeException(
            $data['date'],
            $request->boolean('closed'),
            $data['opens_at'] ?? null,
            $data['closes_at'] ?? null,
            $data['label'] ?? null,
        );

        return back()->with('toast', [
            'message' => 'Agregaste la excepción.',
            'variant' => 'ok',
        ]);
    }

    public function destroyException(ClinicScheduleException $clinicScheduleException, ClinicScheduleService $clinic): RedirectResponse
    {
        $clinic->deleteException($clinicScheduleException);

        return back()->with('toast', [
            'message' => 'Quitaste la excepción.',
            'variant' => 'ok',
        ]);
    }
}
