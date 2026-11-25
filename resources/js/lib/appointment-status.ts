import { pad2 } from '@/lib/datetime';
import type { AppointmentAttendance, AppointmentStatusName } from '@/types';

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatusName, string> = {
    scheduled: 'Programado',
    past: 'Pasado',
    attended: 'Atendido',
    absent: 'Ausente',
};

/** Same grace as `AppointmentStatus::PAST_GRACE_HOURS`. */
const PAST_GRACE_HOURS = 24;

function wallToDate(value: string): Date {
    const [date, time = '00:00:00'] = value.split(' ');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second] = time.split(':').map(Number);

    return new Date(year, (month ?? 1) - 1, day, hour ?? 0, minute ?? 0, second ?? 0);
}

function nowWall(): string {
    const now = new Date();

    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

/** Wall-clock comparison (`Y-m-d H:i:s`), like the rest of the client. */
export function appointmentStarted(startsAt: string): boolean {
    return startsAt <= nowWall();
}

/**
 * Client mirror of `Appointment::status`, used only after a local change (the server value wins on load).
 */
export function appointmentStatus(startsAt: string, attendance: AppointmentAttendance | null): AppointmentStatusName {
    if (attendance) {
        return attendance;
    }

    const pastAt = wallToDate(startsAt);
    pastAt.setHours(pastAt.getHours() + PAST_GRACE_HOURS);

    return Date.now() >= pastAt.getTime() ? 'past' : 'scheduled';
}
