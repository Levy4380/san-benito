<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAvailabilityWindowRequest;
use App\Models\AvailabilityWindow;
use App\Services\AvailabilityWindowService;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AvailabilityWindowController extends Controller
{
    public function store(
        StoreAvailabilityWindowRequest $request,
        DoctorService $doctors,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $doctor = $doctors->forUser($request->user());
        $windows->assertOwnedBy($request->user(), $doctor, 'create');
        $windows->createShortWindow($doctor, $request->validated('starts_at'));

        return back()->with('toast', [
            'message' => 'Cargaste el horario.',
            'variant' => 'ok',
        ]);
    }

    public function destroy(
        Request $request,
        AvailabilityWindow $window,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $this->authorize('delete', $window);
        $windows->delete($window);

        return back()->with('toast', [
            'message' => 'Borraste la franja.',
            'variant' => 'ok',
        ]);
    }
}
