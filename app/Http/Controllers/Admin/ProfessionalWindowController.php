<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProgramAvailabilityWindowsRequest;
use App\Http\Requests\StoreAvailabilityWindowRequest;
use App\Models\Professional;
use App\Services\AvailabilityWindowService;
use Illuminate\Http\RedirectResponse;

class ProfessionalWindowController extends Controller
{
    public function store(
        StoreAvailabilityWindowRequest $request,
        Professional $professional,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $windows->assertOwnedBy($request->user(), $professional, Permission::AvailabilityCreate);
        $windows->createShortWindow($professional, $request->validated('starts_at'));

        return back()->with('toast', [
            'message' => 'Cargaste el horario.',
            'variant' => 'ok',
        ]);
    }

    public function program(
        ProgramAvailabilityWindowsRequest $request,
        Professional $professional,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $windows->assertOwnedBy($request->user(), $professional, Permission::AvailabilityProgram);
        $data = $request->validated();

        $windows->program(
            $professional,
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
