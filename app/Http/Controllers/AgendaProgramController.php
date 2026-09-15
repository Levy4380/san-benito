<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProgramAvailabilityWindowsRequest;
use App\Services\AgendaService;
use App\Services\AvailabilityWindowService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaProgramController extends Controller
{
    public function create(Request $request, DoctorService $doctors, AgendaService $agenda): Response
    {
        $doctor = $doctors->forUser($request->user());

        return Inertia::render('Doctor/Program', [
            'doctor' => $doctor->load(['user', 'specialties']),
            'tones' => $agenda->tonesForNearbyMonths($doctor),
        ]);
    }

    public function store(
        ProgramAvailabilityWindowsRequest $request,
        DoctorService $doctors,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());
        $windows->assertOwnedBy($request->user(), $doctor, 'program');
        $data = $request->validated();

        $windows->program(
            $doctor,
            $data['dates'],
            $data['ranges'],
            (bool) ($data['block_weekends'] ?? false),
        );

        return redirect()->route('agenda')->with('toast', [
            'message' => 'Programaste las franjas.',
            'variant' => 'ok',
        ]);
    }
}
