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

        $daySlots = collect();
        if ($selectedDate) {
            $dayStart = Carbon::parse($selectedDate)->startOfDay();
            $dayEnd = Carbon::parse($selectedDate)->endOfDay();
            // Staff assign any free calculated slot (d42); patients only see the first offerable of the day (d39).
            $daySlots = $staff
                ? ($dayEnd->lt(now())
                    ? collect()
                    : $availability->calculateSlots(
                        $doctor,
                        $dayStart->lt(now()) ? now() : $dayStart,
                        $dayEnd,
                    )->values())
                : $availability->nextOfferableSlotPerDay($doctor, $dayStart, $dayEnd);
        }

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
