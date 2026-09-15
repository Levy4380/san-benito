<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Services\AdminUserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(Request $request, AdminUserService $users): Response
    {
        $name = $request->input('name');
        $email = $request->input('email');

        return Inertia::render('Admin/Admins', [
            'users' => $users->listStaff(
                is_string($name) ? $name : null,
                is_string($email) ? $email : null,
            ),
            'filters' => [
                'name' => is_string($name) ? $name : '',
                'email' => is_string($email) ? $email : '',
            ],
        ]);
    }

    public function store(StoreAdminUserRequest $request, AdminUserService $users): RedirectResponse
    {
        $users->create($request->validated());

        return back()->with('toast', [
            'message' => 'Creaste el administrador.',
            'variant' => 'ok',
        ]);
    }
}
