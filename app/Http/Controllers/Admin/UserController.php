<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminUserRequest;
use App\Models\User;
use App\Services\DoctorService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/users', [
            'users' => User::query()
                ->with('roles')
                ->orderBy('id')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                ]),
        ]);
    }

    public function store(StoreAdminUserRequest $request, DoctorService $doctorService): RedirectResponse
    {
        $doctorService->createAdminUser($request->validated());

        return back()->with('success', 'Usuario creado correctamente.');
    }
}
