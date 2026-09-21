<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\RoleRedirector;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'demoAccounts' => app()->environment('local') ? [
                ['role' => 'Super admin', 'name' => 'Super admin', 'email' => 'superadmin@test.test'],
                ['role' => 'Admin', 'name' => 'Secretaria', 'email' => 'admin@test.test'],
                ['role' => 'Doctor', 'name' => 'Doctor', 'email' => 'doctor@test.test'],
                ['role' => 'Paciente', 'name' => 'Paciente', 'email' => 'paciente@test.test'],
            ] : [],
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(RoleRedirector::intendedPath($request->user()));
    }

    public function destroy(Request $request): SymfonyResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::location(redirect()->route('login'));
    }
}
