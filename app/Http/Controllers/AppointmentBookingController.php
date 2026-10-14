<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Controllers\Admin\ProfessionalAppointmentController;
use App\Http\Requests\BookAppointmentRequest;
use App\Models\Professional;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AppointmentBookingController extends Controller
{
    public function store(Request $request, Professional $professional, AppointmentService $appointments): RedirectResponse
    {
        if ($request->exists('patient_id') || Permission::AppointmentsAssign->allows($request->user())) {
            return app()->call([app(ProfessionalAppointmentController::class), 'store'], [
                'professional' => $professional,
                'appointments' => $appointments,
            ]);
        }

        $booking = BookAppointmentRequest::createFrom($request);
        $booking->setContainer(app())->setRedirector(app('redirect'));
        $booking->validateResolved();

        $appointment = $appointments->book(
            $booking->user(),
            $professional,
            $booking->validated('starts_at'),
            (int) $booking->validated('specialty_id'),
        );

        $wall = $appointment->starts_at->format('Y-m-d').' · '.$appointment->starts_at->format('H:i');

        return redirect()->route('paciente.my-appointments')->with('toast', [
            'message' => 'Reservaste el turno. '.$wall,
            'variant' => 'ok',
        ]);
    }
}
