import type { ClinicSchedule, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export type { ClinicSchedule };

const FALLBACK: ClinicSchedule = {
    openDays: [1, 2, 3, 4, 5, 6, 7],
    opensAt: '07:00',
    closesAt: '21:00',
    exceptions: [],
};

export function useClinic(): ClinicSchedule {
    const clinic = usePage<SharedData>().props.clinic;

    if (!clinic) {
        return FALLBACK;
    }

    return {
        ...clinic,
        exceptions: clinic.exceptions ?? [],
    };
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

function clockFromMinutes(minutes: number): string {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Hours that apply to one civil day. Null when the sanatorium is closed. An exception replaces the weekly schedule. */
export function clinicHours(dateKey: string, clinic: ClinicSchedule): { opensAt: string; closesAt: string } | null {
    const exception = (clinic.exceptions ?? []).find((item) => item.date === dateKey);

    if (exception) {
        if (exception.closed || !exception.opensAt || !exception.closesAt) {
            return null;
        }

        return { opensAt: exception.opensAt, closesAt: exception.closesAt };
    }

    if (!clinic.openDays.includes(isoWeekday(dateKey))) {
        return null;
    }

    return { opensAt: clinic.opensAt, closesAt: clinic.closesAt };
}

export function isClinicOpen(dateKey: string, clinic: ClinicSchedule): boolean {
    return clinicHours(dateKey, clinic) !== null;
}

/** Closed days fade on the calendar. A date with different hours is marked solid. */
export function clinicDayMark(dateKey: string, clinic: ClinicSchedule): 'closed' | 'shifted' | null {
    const exception = (clinic.exceptions ?? []).find((item) => item.date === dateKey);

    if (exception) {
        if (exception.closed || !exception.opensAt || !exception.closesAt) {
            return 'closed';
        }

        const weeklyOpen = clinic.openDays.includes(isoWeekday(dateKey));
        const sameHours = exception.opensAt === clinic.opensAt && exception.closesAt === clinic.closesAt;

        return weeklyOpen && sameHours ? null : 'shifted';
    }

    if (!clinic.openDays.includes(isoWeekday(dateKey))) {
        return 'closed';
    }

    return null;
}

/** Intersection of the hours of the given days. Null if one is closed or the ranges do not overlap. */
export function sharedClinicBounds(dateKeys: string[], clinic: ClinicSchedule): { opensAt: string; closesAt: string } | null {
    if (dateKeys.length === 0) {
        return null;
    }

    let open = 0;
    let close = 24 * 60;

    for (const dateKey of dateKeys) {
        const hours = clinicHours(dateKey, clinic);

        if (!hours) {
            return null;
        }

        open = Math.max(open, clockMinutes(hours.opensAt));
        close = Math.min(close, clockMinutes(hours.closesAt));
    }

    if (open >= close) {
        return null;
    }

    return { opensAt: clockFromMinutes(open), closesAt: clockFromMinutes(close) };
}

export function closedWeekdays(openDays: number[]): number[] {
    return [1, 2, 3, 4, 5, 6, 7].filter((day) => !openDays.includes(day));
}
