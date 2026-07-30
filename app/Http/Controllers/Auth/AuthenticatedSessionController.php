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

class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'demoAccounts' => app()->environment('local') ? [
                ['label' => 'Paciente — Juan', 'email' => 'juan@sanbenito.test'],
                ['label' => 'Paciente — Laura', 'email' => 'laura@sanbenito.test'],
                ['label' => 'Doctor — Ana Pérez', 'email' => 'ana.perez@sanbenito.test'],
                ['label' => 'Doctor — Luis Gómez', 'email' => 'luis.gomez@sanbenito.test'],
                ['label' => 'Doctor — María López', 'email' => 'maria.lopez@sanbenito.test'],
                ['label' => 'Administrador', 'email' => 'admin@sanbenito.test'],
                ['label' => 'Super administrador', 'email' => 'superadmin@sanbenito.test'],
            ] : [],
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(RoleRedirector::home($request->user()));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
