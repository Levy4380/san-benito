<?php

namespace App\Http\Controllers;

use App\Services\AppointmentService;
use App\Services\ProfessionalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalHomeController extends Controller
{
    public function index(Request $request, ProfessionalService $professionals, AppointmentService $appointments): Response
    {
        abort_unless($request->user()?->hasRole('professional'), 403);

        $professional = $professionals->forUser($request->user());

        return Inertia::render('Professional/Home', [
            'upcoming' => $appointments->upcomingThisWeekForProfessional($professional),
        ]);
    }
}
