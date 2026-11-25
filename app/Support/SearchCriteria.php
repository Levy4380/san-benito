<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

final class SearchCriteria
{
    /**
     * @param  list<string>  $allowed
     */
    public static function appointmentBy(Request $request, bool $allowProfessional): ?string
    {
        $allowed = $allowProfessional
            ? ['date', 'professional', 'patient', 'specialty']
            : ['date', 'patient', 'specialty'];

        $by = $request->string('by')->toString();

        if (! in_array($by, $allowed, true)) {
            return null;
        }

        $ok = match ($by) {
            'date' => $request->filled('date'),
            'professional' => $request->integer('professional_id') > 0,
            'patient' => $request->integer('patient_id') > 0,
            'specialty' => $request->integer('specialty_id') > 0,
            default => false,
        };

        return $ok ? $by : null;
    }

    /**
     * @param  list<string>  $allowed
     */
    public static function surgeryBy(Request $request, bool $allowProfessional): ?string
    {
        $allowed = $allowProfessional
            ? ['date', 'professional', 'patient', 'insurance']
            : ['date', 'patient', 'insurance'];

        $by = $request->string('by')->toString();

        if (! in_array($by, $allowed, true)) {
            return null;
        }

        $ok = match ($by) {
            'date' => $request->filled('date'),
            'professional' => $request->integer('professional_id') > 0,
            'patient' => trim($request->string('q')->toString()) !== '',
            'insurance' => $request->filled('health_insurance_id'),
            default => false,
        };

        return $ok ? $by : null;
    }

    /**
     * @return LengthAwarePaginator<int, never>
     */
    public static function emptyPaginator(Request $request, int $perPage = 25): LengthAwarePaginator
    {
        return new LengthAwarePaginator([], 0, $perPage, 1, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);
    }
}
