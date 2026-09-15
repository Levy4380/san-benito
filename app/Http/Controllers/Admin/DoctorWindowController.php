<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProgramAvailabilityWindowsRequest;
use App\Http\Requests\StoreAvailabilityWindowRequest;
use App\Models\Doctor;
use App\Services\AvailabilityWindowService;
use Illuminate\Http\RedirectResponse;

class DoctorWindowController extends Controller
{
    public function store(
        StoreAvailabilityWindowRequest $request,
        Doctor $doctor,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $windows->assertOwnedBy($request->user(), $doctor, 'create');
        $windows->createShortWindow($doctor, $request->validated('starts_at'));

        return back()->with('toast', [
            'message' => 'Cargaste el horario.',
            'variant' => 'ok',
        ]);
    }

    public function program(
        ProgramAvailabilityWindowsRequest $request,
        Doctor $doctor,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $windows->assertOwnedBy($request->user(), $doctor, 'program');
        $data = $request->validated();

        $windows->program(
            $doctor,
            $data['dates'],
            $data['ranges'],
            (bool) ($data['block_weekends'] ?? false),
        );

        return back()->with('toast', [
            'message' => 'Programaste las franjas.',
            'variant' => 'ok',
        ]);
    }
}
