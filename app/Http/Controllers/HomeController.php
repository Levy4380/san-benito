<?php

namespace App\Http\Controllers;

use App\Support\RoleRedirector;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        return redirect()->to(RoleRedirector::landing($user));
    }
}
