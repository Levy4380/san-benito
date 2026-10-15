import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export type ClinicSchedule = {
    /** ISO-8601: 1 = lunes … 7 = domingo */
    openDays: number[];
    opensAt: string;
    closesAt: string;
};

const FALLBACK: ClinicSchedule = {
    openDays: [1, 2, 3, 4, 5, 6, 7],
    opensAt: '07:00',
    closesAt: '21:00',
};

export function useClinic(): ClinicSchedule {
    return usePage<SharedData>().props.clinic ?? FALLBACK;
}

export function clockMinutes(value: string): number {
    const [hour, minute] = value.split(':').map(Number);

    return (hour ?? 0) * 60 + (minute ?? 0);
}

export function isoWeekday(dateKey: string): number {
    const [year, month, day] = dateKey.split('-').map(Number);
    const weekday = new Date(year, (month ?? 1) - 1, day).getDay();

    return weekday === 0 ? 7 : weekday;
}

export function isClinicOpen(dateKey: string, openDays: number[]): boolean {
    return openDays.includes(isoWeekday(dateKey));
}

export function closedWeekdays(openDays: number[]): number[] {
    return [1, 2, 3, 4, 5, 6, 7].filter((day) => !openDays.includes(day));
}
