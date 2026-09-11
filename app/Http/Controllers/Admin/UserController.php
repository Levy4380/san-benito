<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Services\AdminUserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(AdminUserService $users): Response
    {
        return Inertia::render('Admin/Users', [
            'users' => $users->listStaff(),
        ]);
    }

    public function store(StoreAdminUserRequest $request, AdminUserService $users): RedirectResponse
    {
        $users->create($request->validated());

        return back()->with('toast', [
            'message' => 'Creaste el usuario.',
            'variant' => 'ok',
        ]);
    }
}
