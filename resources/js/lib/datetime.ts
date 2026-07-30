/**
 * Appointment datetimes are wall-clock for the institution (DESIGN.md).
 * Do not shift by the browser's UTC offset — strip trailing Z / ms and read components.
 */

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

type WallClock = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

export function parseWallClock(value: string): WallClock {
    const cleaned = value.trim().replace(/\.\d+/, '').replace(/Z$/i, '').replace(' ', 'T');
    const [datePart, timePart = '00:00:00'] = cleaned.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second = 0] = timePart.split(':').map((part) => Number(part));

    return {
        year,
        month,
        day,
        hour,
        minute,
        second: Math.floor(second),
    };
}

/** YYYY-MM-DD from an appointment datetime string (wall-clock). */
export function wallClockDateKey(value: string): string {
    const { year, month, day } = parseWallClock(value);

    return `${year}-${pad(month)}-${pad(day)}`;
}

/** HH:mm from an appointment datetime string (wall-clock). */
export function formatWallClockTime(value: string): string {
    const { hour, minute } = parseWallClock(value);

    return `${pad(hour)}:${pad(minute)}`;
}

/** Local Date for calendar math — uses wall-clock fields, not UTC. */
export function wallClockToLocalDate(value: string): Date {
    const { year, month, day, hour, minute, second } = parseWallClock(value);

    return new Date(year, month - 1, day, hour, minute, second);
}
