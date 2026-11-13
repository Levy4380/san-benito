<?php

namespace App\Http\Controllers\Professional;

use App\Http\Controllers\Controller;
use App\Services\AppointmentService;
use App\Services\ProfessionalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentHistoryController extends Controller
{
    public function __invoke(Request $request, ProfessionalService $professionals, AppointmentService $appointments): Response
    {
        $professional = $professionals->forUser($request->user());

        return Inertia::render('Appointments/History', [
            'appointments' => $appointments->pastForProfessional($professional),
            'backHref' => '/profesional/agenda',
            'backLabel' => 'Mi agenda',
        ]);
    }
}
