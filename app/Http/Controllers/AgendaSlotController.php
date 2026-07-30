<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAgendaSlotRequest;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AgendaSlotController extends Controller
{
    public function store(StoreAgendaSlotRequest $request, AppointmentService $appointmentService): RedirectResponse
    {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $data = $request->validated();

        if ($data['mode'] === 'range') {
            $created = $appointmentService->createSlotsFromRange(
                $doctor,
                Carbon::parse($data['starts_at']),
                Carbon::parse($data['ends_at']),
            );

            $count = $created->count();

            return back()->with(
                'success',
                $count === 1
                    ? 'Se creó 1 horario disponible.'
                    : "Se crearon {$count} horarios disponibles.",
            );
        }

        $appointmentService->createSlot($doctor, [
            'starts_at' => $data['starts_at'],
        ]);

        return back()->with('success', 'Horario disponible creado.');
    }

    public function destroy(Request $request, Appointment $appointment, AppointmentService $appointmentService): RedirectResponse
    {
        $this->authorize('delete', $appointment);

        abort_unless($request->user()->doctor?->id === $appointment->doctor_id, 403);

        $appointmentService->deleteSlot($appointment);

        return back()->with('success', 'Horario eliminado.');
    }
}
