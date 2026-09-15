<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDoctorSpecialtiesRequest;
use App\Models\Doctor;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;

class DoctorSpecialtyController extends Controller
{
    public function update(UpdateDoctorSpecialtiesRequest $request, Doctor $doctor, DoctorService $doctors): RedirectResponse
    {
        $doctors->syncSpecialties($doctor, $request->validated('specialty_ids'));

        return back()->with('toast', [
            'message' => 'Actualizaste las especialidades.',
            'variant' => 'ok',
        ]);
    }
}
