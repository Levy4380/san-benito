<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProfessionalAppointmentRequest;
use App\Models\Professional;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;

class ProfessionalAppointmentController extends Controller
{
    public function store(
        StoreProfessionalAppointmentRequest $request,
        Professional $professional,
        AppointmentService $appointments,
    ): RedirectResponse {
        $appointment = $appointments->assignAsStaff(
            $professional,
            (int) $request->validated('patient_id'),
            $request->validated('starts_at'),
            (int) $request->validated('specialty_id'),
        )->load('patient');

        return redirect()
            ->route('admin.professionals.slots', [
                'professional' => $professional->id,
                'date' => $appointment->starts_at->toDateString(),
                'specialty_id' => $appointment->specialty_id,
            ])
            ->with('toast', [
                'message' => 'Agendaste el turno de '.$appointment->patient->name.' a las '.$appointment->starts_at->format('H:i').'.',
                'variant' => 'ok',
            ]);
    }
}
