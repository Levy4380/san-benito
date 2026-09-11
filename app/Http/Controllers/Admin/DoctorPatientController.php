<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LinkPatientRequest;
use App\Models\Doctor;
use App\Services\DoctorPatientService;
use Illuminate\Http\RedirectResponse;

class DoctorPatientController extends Controller
{
    public function store(
        LinkPatientRequest $request,
        Doctor $doctor,
        DoctorPatientService $links,
    ): RedirectResponse {
        $patient = $links->findPatient((int) $request->validated('patient_id'));
        $links->link($doctor, $patient);

        return back()->with('toast', [
            'message' => 'Vinculaste al paciente.',
            'variant' => 'ok',
        ]);
    }
}
