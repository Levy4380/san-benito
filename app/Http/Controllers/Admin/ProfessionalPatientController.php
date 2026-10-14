<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LinkPatientRequest;
use App\Models\Professional;
use App\Services\ProfessionalPatientService;
use Illuminate\Http\RedirectResponse;

class ProfessionalPatientController extends Controller
{
    public function store(
        LinkPatientRequest $request,
        Professional $professional,
        ProfessionalPatientService $links,
    ): RedirectResponse {
        $patient = $links->findPatient((int) $request->validated('patient_id'));
        $links->link($professional, $patient);

        return back()->with('toast', [
            'message' => 'Vinculaste al paciente.',
            'variant' => 'ok',
        ]);
    }
}
