<?php

namespace App\Http\Controllers\Professional;

use App\Http\Controllers\Controller;
use App\Services\AdminAppointmentService;
use App\Services\ProfessionalService;
use App\Support\HistorySearch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentHistoryController extends Controller
{
    public function __invoke(
        Request $request,
        ProfessionalService $professionals,
        AdminAppointmentService $appointments,
    ): Response {
        $professional = $professionals->forUser($request->user());
        $by = HistorySearch::appointmentBy($request, false);
        $filters = [
            'professional_id' => null,
            'patient_id' => $request->integer('patient_id') ?: null,
            'specialty_id' => $request->integer('specialty_id') ?: null,
            'date' => $request->filled('date') ? $request->string('date')->toString() : null,
        ];

        return Inertia::render('Professional/AppointmentHistory', [
            'appointments' => $by === null
                ? HistorySearch::emptyPaginator($request)
                : $appointments->paginate($filters, $professional->id),
            'filters' => $filters,
            'by' => $by,
            ...$appointments->filterOptions($professional),
        ]);
    }
}
