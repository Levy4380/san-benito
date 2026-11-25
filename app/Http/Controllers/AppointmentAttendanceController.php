<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\UpdateAppointmentAttendanceRequest;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;

class AppointmentAttendanceController extends Controller
{
    public function update(UpdateAppointmentAttendanceRequest $request, Appointment $appointment, AppointmentService $appointments): RedirectResponse
    {
        $updated = $appointments->setAttendance($appointment, $request->attendance());
        $status = AppointmentStatus::from($updated->status);

        return back()->with('toast', [
            'message' => "El turno quedó como {$status->label()}.",
            'variant' => 'ok',
        ]);
    }
}
