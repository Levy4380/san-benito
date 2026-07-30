<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\GenerateDoctorAgendaRequest;
use App\Http\Requests\Settings\UpdateDoctorAgendaSettingsRequest;
use App\Services\AppointmentService;
use App\Services\DoctorService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAgendaSettingsController extends Controller
{
    private const MONTH_NAMES = [
        1 => 'Enero',
        2 => 'Febrero',
        3 => 'Marzo',
        4 => 'Abril',
        5 => 'Mayo',
        6 => 'Junio',
        7 => 'Julio',
        8 => 'Agosto',
        9 => 'Septiembre',
        10 => 'Octubre',
        11 => 'Noviembre',
        12 => 'Diciembre',
    ];

    public function edit(Request $request): Response
    {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        return Inertia::render('settings/agenda', [
            'doctor' => [
                'id' => $doctor->id,
                'slot_duration_minutes' => $doctor->slot_duration_minutes,
            ],
            'generateMonths' => $this->generateMonthOptions(),
        ]);
    }

    public function update(
        UpdateDoctorAgendaSettingsRequest $request,
        DoctorService $doctorService,
    ): RedirectResponse {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $doctorService->updateSlotDuration(
            $doctor,
            (int) $request->validated('slot_duration_minutes'),
        );

        return back()->with('success', 'Configuración de agenda actualizada.');
    }

    public function generate(
        GenerateDoctorAgendaRequest $request,
        AppointmentService $appointmentService,
    ): RedirectResponse {
        $doctor = $request->user()->doctor;

        abort_unless($doctor, 403);

        $validated = $request->validated();
        $month = $this->monthForTarget($validated['target']);
        $result = $appointmentService->generateMonthFromWeeklyTemplate(
            $doctor,
            $month,
            $validated['weekly_availability'],
        );

        return back()->with(
            'success',
            sprintf(
                'Se crearon %d turnos (%d omitidos por solape o pasados).',
                $result['created'],
                $result['skipped'],
            ),
        );
    }

    /**
     * @return list<array{target: string, label: string}>
     */
    private function generateMonthOptions(): array
    {
        $options = [];

        foreach (['current' => 0, 'next' => 1, 'after_next' => 2] as $target => $offset) {
            $date = now()->startOfMonth()->addMonths($offset);
            $options[] = [
                'target' => $target,
                'label' => self::MONTH_NAMES[$date->month].' '.$date->year,
            ];
        }

        return $options;
    }

    private function monthForTarget(string $target): Carbon
    {
        $offset = match ($target) {
            'next' => 1,
            'after_next' => 2,
            default => 0,
        };

        return now()->startOfMonth()->addMonths($offset);
    }
}
