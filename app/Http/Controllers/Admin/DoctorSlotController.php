<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSlotRequest;
use App\Models\Doctor;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;

class DoctorSlotController extends Controller
{
    public function store(StoreSlotRequest $request, Doctor $doctor, AppointmentService $appointmentService): RedirectResponse
    {
        $appointmentService->createSlot($doctor, $request->validated());

        return back()->with('success', 'Horario disponible creado para el doctor.');
    }
}
