<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Doctor;
use App\Services\AgendaService;
use App\Services\AvailabilityService;
use App\Services\DoctorSearchService;
use App\Services\PatientService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DoctorSlotsController extends Controller
{
    public function index(
        Request $request,
        Doctor $doctor,
        AvailabilityService $availability,
        DoctorSearchService $search,
        AgendaService $agenda,
        PatientService $patients,
    ): Response {
        $doctor = $search->profile($doctor);
        $staff = Permission::AppointmentsCatalogView->allows($request->user());
        $day = $request->string('date')->toString();
        $selectedDate = match (true) {
            $day !== '' => Carbon::parse($day)->toDateString(),
            $staff => now()->toDateString(),
            default => null,
        };

        $daysWithSlots = $availability->upcomingDaysWithSlots($doctor, 5);

        $daySlots = $selectedDate
            ? $availability->nextOfferableSlotPerDay(
                $doctor,
                Carbon::parse($selectedDate)->startOfDay(),
                Carbon::parse($selectedDate)->endOfDay(),
            )
            : collect();

        $requestedSpecialtyId = $request->filled('specialty_id') ? $request->integer('specialty_id') : null;
        $specialty = $requestedSpecialtyId
            ? $doctor->specialties->firstWhere('id', $requestedSpecialtyId)
            : null;

        return Inertia::render('Doctors/Slots', [
            'doctor' => $doctor,
            'selectedDate' => $selectedDate,
            'daysWithSlots' => $daysWithSlots,
            'slots' => $daySlots,
            'previewDays' => $daysWithSlots,
            'specialtyId' => $specialty?->id,
            ...($staff && $selectedDate ? $agenda->staffDayTimeline($doctor, $selectedDate) : []),
            ...(Permission::AppointmentsAssign->allows($request->user()) ? ['patients' => $patients->options()] : []),
        ]);
    }
}
