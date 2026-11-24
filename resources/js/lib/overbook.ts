import { pad2 } from '@/lib/datetime';

export type OverbookInterval = { starts_at: string; ends_at: string };

export type OverbookSlot = OverbookInterval & { label: string };

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
    return startA < endB && startB < endA;
}

function wallStamp(date: string, minutes: number): string {
    return `${date} ${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}:00`;
}

/** Blocks of `stepMinutes` outside every window, inside clinic hours, and still in the future. */
export function overbookSlots(input: {
    date: string;
    now: string;
    stepMinutes: number;
    openMinutes: number;
    closeMinutes: number;
    dayOpen: boolean;
    appointments: OverbookInterval[];
    windows: OverbookInterval[];
}): OverbookSlot[] {
    if (!input.dayOpen) {
        return [];
    }

    const slots: OverbookSlot[] = [];

    for (let minute = input.openMinutes; minute + input.stepMinutes <= input.closeMinutes; minute += input.stepMinutes) {
        const startsAt = wallStamp(input.date, minute);
        const endsAt = wallStamp(input.date, minute + input.stepMinutes);

        if (startsAt <= input.now) {
            continue;
        }

        if (input.appointments.some((appointment) => overlaps(startsAt, endsAt, appointment.starts_at, appointment.ends_at))) {
            continue;
        }

        if (input.windows.some((window) => overlaps(startsAt, endsAt, window.starts_at, window.ends_at))) {
            continue;
        }

        slots.push({ starts_at: startsAt, ends_at: endsAt, label: '+ Sobreturno' });
    }

    return slots;
}
