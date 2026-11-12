<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfessionalHealthInsurancesRequest;
use App\Models\Professional;
use App\Services\ProfessionalService;
use App\Support\ProfessionalCatalogReturn;
use Illuminate\Http\RedirectResponse;

class ProfessionalHealthInsuranceController extends Controller
{
    public function update(UpdateProfessionalHealthInsurancesRequest $request, Professional $professional, ProfessionalService $professionals): RedirectResponse
    {
        $professionals->syncHealthInsurances($professional, $request->validated('health_insurance_ids'));

        return ProfessionalCatalogReturn::to($request, $professional, 'Actualizaste las obras sociales.');
    }
}
