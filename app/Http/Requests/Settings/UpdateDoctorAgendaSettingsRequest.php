<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateDoctorAgendaSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:120'],
            'weekly_availability' => ['nullable', 'array'],
            'weekly_availability.*.weekday' => ['required', 'integer', 'min:1', 'max:7'],
            'weekly_availability.*.start' => ['required', 'date_format:H:i'],
            'weekly_availability.*.end' => ['required', 'date_format:H:i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slot_duration_minutes.required' => 'La duración del turno es obligatoria.',
            'slot_duration_minutes.integer' => 'La duración debe ser un número entero.',
            'slot_duration_minutes.min' => 'La duración mínima es de 5 minutos.',
            'slot_duration_minutes.max' => 'La duración máxima es de 120 minutos.',
            'weekly_availability.array' => 'Las franjas semanales deben enviarse como lista.',
            'weekly_availability.*.weekday.required' => 'El día de la semana es obligatorio.',
            'weekly_availability.*.weekday.min' => 'El día de la semana debe ser entre 1 (lunes) y 7 (domingo).',
            'weekly_availability.*.weekday.max' => 'El día de la semana debe ser entre 1 (lunes) y 7 (domingo).',
            'weekly_availability.*.start.required' => 'La hora de inicio es obligatoria.',
            'weekly_availability.*.start.date_format' => 'La hora de inicio debe tener formato HH:mm.',
            'weekly_availability.*.end.required' => 'La hora de fin es obligatoria.',
            'weekly_availability.*.end.date_format' => 'La hora de fin debe tener formato HH:mm.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $bands = $this->input('weekly_availability');

            if (! is_array($bands)) {
                return;
            }

            $byWeekday = [];

            foreach ($bands as $index => $band) {
                $start = $band['start'] ?? null;
                $end = $band['end'] ?? null;
                $weekday = $band['weekday'] ?? null;

                if (! is_string($start) || ! is_string($end) || ! is_numeric($weekday)) {
                    continue;
                }

                if ($end <= $start) {
                    $validator->errors()->add(
                        "weekly_availability.{$index}.end",
                        'La hora de fin debe ser posterior a la de inicio.',
                    );

                    continue;
                }

                $byWeekday[(int) $weekday][] = [
                    'index' => $index,
                    'start' => $start,
                    'end' => $end,
                ];
            }

            foreach ($byWeekday as $ranges) {
                usort($ranges, fn (array $a, array $b): int => strcmp($a['start'], $b['start']));

                for ($i = 1; $i < count($ranges); $i++) {
                    if ($ranges[$i]['start'] < $ranges[$i - 1]['end']) {
                        $validator->errors()->add(
                            "weekly_availability.{$ranges[$i]['index']}.start",
                            'Las franjas del mismo día no pueden solaparse.',
                        );
                    }
                }
            }
        });
    }
}
