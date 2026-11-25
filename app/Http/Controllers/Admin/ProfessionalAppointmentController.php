<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProfessionalAppointmentRequest;
use App\Models\Professional;
use App\Services\AppointmentService;
use App\Support\ProfessionalCatalogReturn;
use Illuminate\Http\RedirectResponse;

class ProfessionalAppointmentController extends Controller
{
    public function store(
        StoreProfessionalAppointmentRequest $request,
        Professional $professional,
        AppointmentService $appointments,
    ): RedirectResponse {
        $result = $appointments->assignAsStaff(
            $professional,
            (int) $request->validated('patient_id'),
            $request->validated('starts_at'),
            (int) $request->validated('specialty_id'),
        );
        $appointment = $result['appointment']->load('patient');
        $message = $result['overbook']
            ? 'Cargaste el sobreturno de '.$appointment->patient->name.' a las '.$appointment->starts_at->format('H:i').'.'
            : 'Asignaste el turno de '.$appointment->patient->name.' a las '.$appointment->starts_at->format('H:i').'.';

        return redirect()
            ->to(ProfessionalCatalogReturn::href($professional, 'agenda'))
            ->with('toast', [
                'message' => $message,
                'variant' => 'ok',
            ]);
    }
}
