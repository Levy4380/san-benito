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

        $rangeStart = now();
        $rangeEnd = now()->addDays(60)->endOfDay();
        $slots = $availability->calculateSlots($doctor, $rangeStart, $rangeEnd);
        $daysWithSlots = $availability->upcomingDaysWithSlots($doctor, 5);

        $daySlots = $selectedDate
            ? $slots->filter(fn (array $slot) => str_starts_with($slot['starts_at'], $selectedDate))->values()
            : collect();

        $requestedSpecialtyId = $request->filled('specialty_id') ? $request->integer('specialty_id') : null;
        $specialty = $requestedSpecialtyId
            ? $doctor->specialties->firstWhere('id', $requestedSpecialtyId)
            : null;

        return Inertia::render('Doctors/Slots', [
            'doctor' => $doctor,
            'selectedDate' => $selectedDate,
            'daysWithSlots' => $daysWithSlots,
            'slots' => $selectedDate ? $daySlots : $slots,
            'previewDays' => $daysWithSlots,
            'specialtyId' => $specialty?->id,
        ]);
    }
}
