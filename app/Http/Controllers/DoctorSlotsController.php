<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Services\AvailabilityService;
use App\Services\DoctorSearchService;
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
    ): Response {
        $doctor = $search->profile($doctor);
        $day = $request->string('date')->toString();
        $selectedDate = $day !== '' ? Carbon::parse($day)->toDateString() : null;

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
        ]);
    }
}
