<?php

namespace App\Http\Controllers;

use App\Services\AppointmentService;
use App\Services\DoctorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorHomeController extends Controller
{
    public function index(Request $request, DoctorService $doctors, AppointmentService $appointments): Response
    {
        $doctor = $doctors->forUser($request->user());

        return Inertia::render('Doctor/Home', [
            'upcoming' => $appointments->upcomingThisWeekForDoctor($doctor),
        ]);
    }
}
