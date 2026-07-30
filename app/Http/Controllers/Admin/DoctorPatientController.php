<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDoctorPatientRequest;
use App\Models\Doctor;
use App\Models\Patient;
use App\Services\DoctorPatientService;
use Illuminate\Http\RedirectResponse;

class DoctorPatientController extends Controller
{
    public function store(
        StoreDoctorPatientRequest $request,
        Doctor $doctor,
        DoctorPatientService $doctorPatientService,
    ): RedirectResponse {
        $patient = Patient::query()->findOrFail($request->validated('patient_id'));
        $doctorPatientService->link($doctor, $patient);

        return back()->with('success', 'Paciente vinculado al doctor correctamente.');
    }
}
