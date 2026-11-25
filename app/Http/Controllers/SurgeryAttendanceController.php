<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSurgeryAttendanceRequest;
use App\Models\Surgery;
use App\Services\SurgeryService;
use Illuminate\Http\RedirectResponse;

class SurgeryAttendanceController extends Controller
{
    public function update(UpdateSurgeryAttendanceRequest $request, Surgery $surgery, SurgeryService $surgeries): RedirectResponse
    {
        $updated = $surgeries->setAttendance($surgery, $request->attendance());

        return back()->with('toast', [
            'message' => "La cirugía quedó como {$updated->statusLabel()}.",
            'variant' => 'ok',
        ]);
    }
}
