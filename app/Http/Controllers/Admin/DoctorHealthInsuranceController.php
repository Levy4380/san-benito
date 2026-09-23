<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDoctorHealthInsurancesRequest;
use App\Models\Doctor;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;

class DoctorHealthInsuranceController extends Controller
{
    public function update(UpdateDoctorHealthInsurancesRequest $request, Doctor $doctor, DoctorService $doctors): RedirectResponse
    {
        $doctors->syncHealthInsurances($doctor, $request->validated('health_insurance_ids'));

        return redirect()
            ->route('doctors.show', $doctor)
            ->with('toast', [
                'message' => 'Actualizaste las obras sociales.',
                'variant' => 'ok',
            ]);
    }
}
