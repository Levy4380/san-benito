<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfessionalHealthInsurancesRequest;
use App\Models\Professional;
use App\Services\ProfessionalService;
use Illuminate\Http\RedirectResponse;

class ProfessionalHealthInsuranceController extends Controller
{
    public function update(UpdateProfessionalHealthInsurancesRequest $request, Professional $professional, ProfessionalService $professionals): RedirectResponse
    {
        $professionals->syncHealthInsurances($professional, $request->validated('health_insurance_ids'));

        return redirect()
            ->route('admin.professionals.show', $professional)
            ->with('toast', [
                'message' => 'Actualizaste las obras sociales.',
                'variant' => 'ok',
            ]);
    }
}
