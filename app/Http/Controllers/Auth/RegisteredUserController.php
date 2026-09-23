<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterPatientRequest;
use App\Services\HealthInsuranceService;
use App\Services\PatientService;
use App\Support\RoleRedirector;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RegisteredUserController extends Controller
{
    public function create(HealthInsuranceService $healthInsurances): Response
    {
        return Inertia::render('auth/register', [
            'healthInsurances' => $healthInsurances->options(),
        ]);
    }

    public function store(RegisterPatientRequest $request, PatientService $patients): SymfonyResponse
    {
        $user = $patients->register($request->validated());

        event(new Registered($user));

        Auth::login($user);

        return Inertia::location(redirect()->to(RoleRedirector::home()));
    }
}
