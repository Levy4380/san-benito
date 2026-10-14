<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfessionalSpecialtiesRequest;
use App\Models\Professional;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;

class ProfessionalSpecialtyController extends Controller
{
    public function update(UpdateProfessionalSpecialtiesRequest $request, Professional $professional, ProfessionalService $professionals): RedirectResponse
    {
        $professionals->syncSpecialties($professional, $request->validated('specialty_ids'));

        return redirect()
            ->route('admin.professionals.show', $professional)
            ->with('toast', [
                'message' => 'Actualizaste las especialidades.',
                'variant' => 'ok',
            ]);
    }
}
