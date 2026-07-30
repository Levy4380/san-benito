<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterPatientRequest;
use App\Services\PatientService;
use App\Support\RoleRedirector;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(RegisterPatientRequest $request, PatientService $patientService): RedirectResponse
    {
        $patient = $patientService->register($request->validated());

        event(new Registered($patient->user));

        Auth::login($patient->user);

        return redirect()->intended(RoleRedirector::home($patient->user));
    }
}
