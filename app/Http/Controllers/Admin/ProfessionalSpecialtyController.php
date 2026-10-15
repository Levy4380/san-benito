<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfessionalSpecialtiesRequest;
use App\Models\Professional;
use App\Services\ProfessionalService;
use App\Support\ProfessionalCatalogReturn;
use Illuminate\Http\RedirectResponse;

class ProfessionalSpecialtyController extends Controller
{
    public function update(UpdateProfessionalSpecialtiesRequest $request, Professional $professional, ProfessionalService $professionals): RedirectResponse
    {
        $professionals->syncSpecialties($professional, $request->validated('specialty_ids'));

        return ProfessionalCatalogReturn::to($request, $professional, 'Actualizaste las especialidades.');
    }
}
