<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Professional;
use App\Services\AgendaService;
use App\Services\AvailabilityService;
use App\Services\PatientService;
use App\Services\ProfessionalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalSlotsController extends Controller
{
    public function index(
        Request $request,
        Professional $professional,
        AvailabilityService $availability,
        ProfessionalSearchService $search,
        AgendaService $agenda,
        PatientService $patients,
    ): Response {
        $staff = $request->routeIs('admin.professionals.slots');

        return Inertia::render(
            'Professionals/Slots',
            $this->payload($request, $professional, $availability, $search, $agenda, $patients, $staff),
        );
    }

    public function agenda(
        Request $request,
        Professional $professional,
        AvailabilityService $availability,
        ProfessionalSearchService $search,
        AgendaService $agenda,
        PatientService $patients,
    ): JsonResponse {
        return response()->json(
            $this->payload($request, $professional, $availability, $search, $agenda, $patients, true),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(
        Request $request,
        Professional $professional,
        AvailabilityService $availability,
        ProfessionalSearchService $search,
        AgendaService $agenda,
        PatientService $patients,
        bool $staff,
    ): array {
        $professional = $search->profile($professional);
        $day = $request->string('date')->toString();
        $selectedDate = match (true) {
            $day !== '' => Carbon::parse($day)->toDateString(),
            $staff => now()->toDateString(),
            default => null,
        };

        $daysWithSlots = $availability->upcomingDaysWithSlots($professional, 5);

        $daySlots = collect();
        if ($selectedDate) {
            $dayStart = Carbon::parse($selectedDate)->startOfDay();
            $dayEnd = Carbon::parse($selectedDate)->endOfDay();
            // Staff assign any free calculated slot (d42); patients only see the first offerable of the day (d39).
            $daySlots = $staff
                ? ($dayEnd->lt(now())
                    ? collect()
                    : $availability->calculateSlots(
                        $professional,
                        $dayStart->lt(now()) ? now() : $dayStart,
                        $dayEnd,
                    )->values())
                : $availability->nextOfferableSlotPerDay($professional, $dayStart, $dayEnd);
        }

        $requestedSpecialtyId = $request->filled('specialty_id') ? $request->integer('specialty_id') : null;
        $specialty = $requestedSpecialtyId
            ? $professional->specialties->firstWhere('id', $requestedSpecialtyId)
            : null;

        return [
            'professional' => $professional,
            'selectedDate' => $selectedDate,
            'daysWithSlots' => $daysWithSlots,
            'slots' => $daySlots,
            'previewDays' => $daysWithSlots,
            'specialtyId' => $specialty?->id,
            ...($staff && $selectedDate ? $agenda->staffDayTimeline($professional, $selectedDate) : []),
            ...(Permission::AppointmentsAssign->allows($request->user()) ? ['patients' => $patients->options()] : []),
        ];
    }
}
