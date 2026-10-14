<?php

namespace App\Http\Controllers;

use App\Services\AgendaService;
use App\Services\DoctorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(Request $request, DoctorService $doctors, AgendaService $agenda): Response
    {
        $doctor = $doctors->forUser($request->user());
        $date = $request->filled('date') ? $request->string('date')->toString() : null;

        return Inertia::render('Doctor/Agenda', $agenda->pageData($doctor, $date, $request->input('panel')));
    }
}
