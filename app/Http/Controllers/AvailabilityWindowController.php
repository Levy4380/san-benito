<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\StoreAvailabilityWindowRequest;
use App\Models\AvailabilityWindow;
use App\Services\AvailabilityWindowService;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AvailabilityWindowController extends Controller
{
    public function store(
        StoreAvailabilityWindowRequest $request,
        ProfessionalService $professionals,
        AvailabilityWindowService $windows,
    ): RedirectResponse {
        $professional = $professionals->forUser($request->user());
        $windows->assertOwnedBy($request->user(), $professional, Permission::AvailabilityCreate);
        $startsAt = $request->validated('starts_at');
        $windows->createShortWindow($professional, $startsAt);

        return redirect()
            ->route('professional.agenda', ['date' => Carbon::parse($startsAt)->toDateString()])
            ->with('toast', [
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
