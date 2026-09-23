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
        $term = $request->input('q');

        return Inertia::render('Admin/Admins', [
            'users' => $users->listStaff(is_string($term) ? $term : null),
            'filters' => [
                'q' => is_string($term) ? $term : '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/AdminCreate');
    }

    public function store(StoreAdminUserRequest $request, AdminUserService $users): RedirectResponse
    {
        $users->create($request->validated());

        return redirect()
            ->route('admin.admins.index')
            ->with('toast', [
                'message' => 'Creaste el administrador.',
                'variant' => 'ok',
            ]);
    }
}
