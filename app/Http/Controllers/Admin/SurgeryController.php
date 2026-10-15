<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SurgeryStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ScheduleSurgeryRequest;
use App\Http\Requests\Admin\StoreSurgeryRequest;
use App\Models\Surgery;
use App\Services\AdminSurgeryService;
use App\Services\SurgeryService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SurgeryController extends Controller
{
    public function index(Request $request, AdminSurgeryService $surgeries): Response
    {
        $section = $this->section($request->string('section')->toString());

        $filters = [
            'q' => trim($request->string('q')->toString()),
            'specialty_id' => $request->integer('specialty_id') ?: null,
            'professional_id' => $request->integer('professional_id') ?: null,
            'health_insurance_id' => $this->insuranceFilter($request),
            'status' => $section === 'approved' ? $this->statusFilter($request) : null,
        ];

        return Inertia::render('Admin/Surgeries', [
            'section' => $section,
            'surgeries' => $surgeries->paginate($section, $filters),
            'filters' => $filters,
            'openSurgeryId' => $request->integer('surgery') ?: null,
            ...$surgeries->filterOptions(),
        ]);
    }

    public function create(AdminSurgeryService $surgeries): JsonResponse
    {
        $options = $surgeries->filterOptions();

        return response()->json([
            'professionals' => $options['professionals'],
            'healthInsurances' => $options['healthInsurances'],
        ]);
    }

    public function store(StoreSurgeryRequest $request, SurgeryService $surgeries): RedirectResponse
    {
        $insurance = $request->validated('health_insurance_id');

        $surgery = $surgeries->request(
            $request->user(),
            (int) $request->validated('patient_id'),
            (int) $request->validated('professional_id'),
            $insurance === null ? null : (int) $insurance,
            (string) $request->validated('note'),
        );

        $section = $surgery->status === SurgeryStatus::ToSchedule ? 'approved' : 'pending';

        return redirect()
            ->route('admin.surgeries.index', ['section' => $section])
            ->with('toast', [
                'message' => $section === 'approved'
                    ? 'Solicitaste la cirugía. Quedó a programar.'
                    : 'Solicitaste la cirugía.',
                'variant' => 'ok',
            ]);
    }

    public function patients(Request $request, AdminSurgeryService $surgeries): JsonResponse
    {
        return response()->json([
            'patients' => $surgeries->searchPatients($request->string('q')->toString()),
        ]);
    }

    public function markRequested(Request $request, Surgery $surgery, SurgeryService $surgeries): RedirectResponse
    {
        $surgeries->markRequested($request->user(), $surgery);

        return redirect()
            ->route('admin.surgeries.index', ['section' => 'requested', 'surgery' => $surgery->id])
            ->with('toast', [
                'message' => 'Marcaste la cirugía como solicitada.',
                'variant' => 'ok',
            ]);
    }

    public function approve(Request $request, Surgery $surgery, SurgeryService $surgeries): RedirectResponse
    {
        $surgeries->approve($request->user(), $surgery);

        return redirect()
            ->route('admin.surgeries.index', ['section' => 'approved', 'surgery' => $surgery->id])
            ->with('toast', [
                'message' => 'Cirugía aprobada. Quedó a programar.',
                'variant' => 'ok',
            ]);
    }

    public function calendar(Request $request): Response
    {
        return Inertia::render('Admin/SurgeryCalendar', $this->calendarProps($request, null));
    }

    public function schedule(Request $request, Surgery $surgery): Response
    {
        if ($surgery->status !== SurgeryStatus::ToSchedule) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede programar una cirugía a programar.',
            ]);
        }

        $surgery->load(['patient', 'professional.user', 'professional.specialties', 'healthInsurance']);

        return Inertia::render('Admin/SurgeryCalendar', $this->calendarProps($request, $surgery));
    }

    public function storeSchedule(ScheduleSurgeryRequest $request, Surgery $surgery, SurgeryService $surgeries): RedirectResponse
    {
        $saved = $surgeries->schedule(
            $request->user(),
            $surgery,
            (string) $request->validated('starts_at'),
            (string) $request->validated('ends_at'),
        );

        return redirect()
            ->route('admin.surgeries.index', ['section' => 'approved', 'surgery' => $saved->id])
            ->with('toast', [
                'message' => sprintf(
                    'Cirugía programada: %s %s–%s.',
                    $saved->starts_at?->toDateString(),
                    $saved->starts_at?->format('H:i'),
                    $saved->ends_at?->format('H:i'),
                ),
                'variant' => 'ok',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function calendarProps(Request $request, ?Surgery $scheduling): array
    {
        $today = now()->toDateString();
        $defaultDate = $scheduling === null ? $today : now()->addDay()->toDateString();
        $date = $this->wallDate($request->string('date')->toString(), $defaultDate);

        if ($scheduling !== null && $date < $today) {
            $date = $defaultDate;
        }

        $month = $this->wallDate($request->string('month')->toString(), substr($date, 0, 7).'-01');
        $monthStart = Carbon::parse($month)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $counts = Surgery::query()
            ->where('status', SurgeryStatus::Scheduled)
            ->whereDate('starts_at', '>=', $monthStart->toDateString())
            ->whereDate('starts_at', '<=', $monthEnd->toDateString())
            ->selectRaw('DATE(starts_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(starts_at)')
            ->pluck('total', 'day');

        $tones = [];

        for ($cursor = $monthStart->copy(); $cursor->lte($monthEnd); $cursor->addDay()) {
            $key = $cursor->toDateString();
            $total = (int) ($counts[$key] ?? 0);
            $tones[$key] = $total >= 3 ? 'full' : ($total > 0 ? 'has' : 'empty');
        }

        $daySurgeries = Surgery::query()
            ->with(['patient', 'professional.user', 'professional.specialties', 'healthInsurance'])
            ->scheduledOnDate($date)
            ->get();

        $from = $this->section($request->string('from')->toString() ?: ($scheduling === null ? 'pending' : 'approved'));

        return [
            'date' => $date,
            'month' => $monthStart->toDateString(),
            'today' => $today,
            'now' => now()->format('Y-m-d H:i:s'),
            'from' => $from,
            'scheduling' => $scheduling !== null,
            'surgery' => $scheduling,
            'suggestion' => $this->suggestion($date, $daySurgeries),
            'tones' => $tones,
            'daySurgeries' => $daySurgeries,
        ];
    }

    /**
     * @param  Collection<int, Surgery>  $busy
     * @return array{starts_at: string, ends_at: string}
     */
    private function suggestion(string $date, $busy): array
    {
        $gaps = $this->freeGaps($date, $busy);

        if ($gaps === []) {
            return ['starts_at' => '09:00', 'ends_at' => '10:00'];
        }

        [$from, $to] = $gaps[0];
        $end = min($from + 60, $to);

        if ($end - $from < 30) {
            return ['starts_at' => '09:00', 'ends_at' => '10:00'];
        }

        return [
            'starts_at' => $this->minutesToTime($from),
            'ends_at' => $this->minutesToTime($end),
        ];
    }

    /**
     * @param  Collection<int, Surgery>  $busy
     * @return list<array{0: int, 1: int}>
     */
    private function freeGaps(string $date, $busy): array
    {
        $dayStart = 7 * 60;
        $dayEnd = 21 * 60;
        $today = now()->toDateString();

        if ($date < $today) {
            $cursor = 24 * 60;
        } elseif ($date > $today) {
            $cursor = $dayStart;
        } else {
            $minutes = (now()->hour * 60) + now()->minute;
            $cursor = max($dayStart, (int) (ceil($minutes / 5) * 5));
        }

        $ranges = $busy
            ->filter(fn (Surgery $surgery): bool => $surgery->starts_at !== null && $surgery->ends_at !== null)
            ->map(fn (Surgery $surgery): array => [
                ($surgery->starts_at->hour * 60) + $surgery->starts_at->minute,
                ($surgery->ends_at->hour * 60) + $surgery->ends_at->minute,
            ])
            ->sortBy(fn (array $range): int => $range[0])
            ->values();

        $gaps = [];

        foreach ($ranges as [$start, $end]) {
            if ($start - $cursor >= 30) {
                $gaps[] = [$cursor, $start];
            }

            $cursor = max($cursor, $end);
        }

        if ($dayEnd - $cursor >= 30) {
            $gaps[] = [$cursor, $dayEnd];
        }

        return $gaps;
    }

    private function minutesToTime(int $minutes): string
    {
        $minutes = max(0, min($minutes, (23 * 60) + 55));

        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }

    private function wallDate(string $value, string $fallback): string
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return $fallback;
        }

        $parsed = Carbon::createFromFormat('Y-m-d', $value);

        return $parsed instanceof Carbon ? $parsed->toDateString() : $fallback;
    }

    private function section(string $section): string
    {
        return in_array($section, ['pending', 'requested', 'approved', 'history'], true) ? $section : 'pending';
    }

    private function insuranceFilter(Request $request): int|string|null
    {
        $value = $request->input('health_insurance_id');

        if ($value === null || $value === '' || $value === 'all') {
            return null;
        }

        if ($value === 'particular') {
            return 'particular';
        }

        $id = (int) $value;

        return $id > 0 ? $id : null;
    }

    private function statusFilter(Request $request): ?string
    {
        $status = $request->string('status')->toString();

        if ($status === SurgeryStatus::ToSchedule->value || $status === SurgeryStatus::Scheduled->value) {
            return $status;
        }

        return null;
    }
}
