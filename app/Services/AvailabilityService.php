<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AvailabilityWindow;
use App\Models\Professional;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AvailabilityService
{
    /**
     * @return Collection<int, array{starts_at: string, ends_at: string}>
     */
    public function calculateSlots(Professional $professional, Carbon $rangeStart, Carbon $rangeEnd): Collection
    {
        $duration = (int) $professional->slot_duration_minutes;

        $windows = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->overlapping($rangeStart, $rangeEnd)
            ->orderBy('starts_at')
            ->get();

        $appointments = Appointment::query()
            ->forProfessional($professional)
            ->overlapping($rangeStart, $rangeEnd)
            ->get();

        $now = now();
        $slots = collect();

        foreach ($windows as $window) {
            $cursor = $window->starts_at->copy();
            $windowEnd = $window->ends_at;

            while (true) {
                $slotEnd = $cursor->copy()->addMinutes($duration);

                if ($slotEnd->gt($windowEnd)) {
                    break;
                }

                if ($cursor->gt($now)) {
                    $overlaps = $appointments->contains(function (Appointment $appointment) use ($cursor, $slotEnd) {
                        return $appointment->starts_at->lt($slotEnd) && $appointment->ends_at->gt($cursor);
                    });

                    if (! $overlaps) {
                        $slots->push([
                            'starts_at' => $cursor->format('Y-m-d H:i:s'),
                            'ends_at' => $slotEnd->format('Y-m-d H:i:s'),
                        ]);
                    }
                }

                $cursor = $slotEnd;
            }
        }

        return $slots->sortBy('starts_at')->values();
    }

    /**
     * First future non-overlapping slot per civil day (institutional timezone).
     *
     * @return Collection<int, array{starts_at: string, ends_at: string}>
     */
    public function nextOfferableSlotPerDay(Professional $professional, Carbon $rangeStart, Carbon $rangeEnd): Collection
    {
        return $this->calculateSlots($professional, $rangeStart, $rangeEnd)
            ->unique(fn (array $slot): string => substr($slot['starts_at'], 0, 10))
            ->values();
    }

    public function isBookableSlot(Professional $professional, Carbon $startsAt): bool
    {
        $duration = (int) $professional->slot_duration_minutes;
        $endsAt = $startsAt->copy()->addMinutes($duration);

        if (! $startsAt->gt(now())) {
            return false;
        }

        $window = AvailabilityWindow::query()
            ->forProfessional($professional)
            ->where('starts_at', '<=', $startsAt)
            ->where('ends_at', '>=', $endsAt)
            ->orderBy('starts_at')
            ->first();

        if ($window === null) {
            return false;
        }

        $offset = (int) $window->starts_at->diffInMinutes($startsAt, false);

        if ($offset < 0 || $offset % $duration !== 0) {
            return false;
        }

        $overlaps = Appointment::query()
            ->forProfessional($professional)
            ->overlapping($startsAt, $endsAt)
            ->exists();

        return ! $overlaps;
    }

    /**
     * @return Collection<int, string> Y-m-d keys of days that have at least one free slot
     */
    public function upcomingDaysWithSlots(Professional $professional, int $limitDays): Collection
    {
        $start = now();
        $end = now()->addDays(60)->endOfDay();
        $slots = $this->calculateSlots($professional, $start, $end);

        return $slots
            ->map(fn (array $slot) => substr($slot['starts_at'], 0, 10))
            ->unique()
            ->take($limitDays)
            ->values();
    }

    public function nextAvailableStartsAt(Professional $professional, ?Carbon $until = null): ?string
    {
        $slot = $this->calculateSlots(
            $professional,
            now(),
            $until ?? now()->addDays(60)->endOfDay(),
        )->first();

        return is_array($slot) ? $slot['starts_at'] : null;
    }
}
