<?php

namespace App\Http\Controllers;

use App\Services\AgendaService;
use App\Services\ProfessionalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(Request $request, ProfessionalService $professionals, AgendaService $agenda): Response
    {
        $professional = $professionals->forUser($request->user());
        $date = $request->filled('date') ? $request->string('date')->toString() : null;

        return Inertia::render('Professional/Agenda', $agenda->pageData($professional, $date, $request->input('panel')));
    }
}
