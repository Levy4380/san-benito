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
                ['role' => 'Paciente', 'name' => 'Juan Paciente', 'email' => 'juan@sanbenito.test'],
                ['role' => 'Paciente', 'name' => 'Laura Paciente', 'email' => 'laura@sanbenito.test'],
                ['role' => 'Doctor', 'name' => 'Ana Pérez', 'email' => 'ana.perez@sanbenito.test'],
                ['role' => 'Doctor', 'name' => 'Luis Gómez', 'email' => 'luis.gomez@sanbenito.test'],
                ['role' => 'Doctor', 'name' => 'María López', 'email' => 'maria.lopez@sanbenito.test'],
                ['role' => 'Admin', 'name' => 'Admin San Benito', 'email' => 'admin@sanbenito.test'],
                ['role' => 'Super admin', 'name' => 'Super Admin', 'email' => 'superadmin@sanbenito.test'],
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
