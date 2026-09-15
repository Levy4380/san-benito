<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use App\Services\PatientService;
use App\Support\RoleRedirector;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(
        Request $request,
        PatientHomeController $patientHome,
        DoctorHomeController $doctorHome,
        PatientService $patients,
        DoctorService $doctors,
        AppointmentService $appointments,
    ): Response|RedirectResponse {
        $user = $request->user();

        if (! Permission::PortalHome->allows($user)) {
            return redirect()->to(RoleRedirector::intendedPath($user));
        }

        if ($user->hasRole('doctor')) {
            return $doctorHome->index($request, $doctors, $appointments);
        }

        if ($user->hasRole('patient')) {
            return $patientHome->index($request, $patients, $appointments);
        }

        abort(403);
    }
}
