export function wallDate(value: string): string {
    return value.slice(0, 10);
}

export function wallTime(value: string): string {
    return value.slice(11, 16);
}

export function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);

    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

export function todayKey(): string {
    const now = new Date();

    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function isWeekendKey(dateKey: string): boolean {
    const [year, month, day] = dateKey.split('-').map(Number);
    const weekday = new Date(year, (month ?? 1) - 1, day).getDay();

    return weekday === 0 || weekday === 6;
}

export function weekdayKeysOfMonth(monthKey: string): string[] {
    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, month ?? 1, 0).getDate();
    const keys: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${pad2(month ?? 1)}-${pad2(day)}`;
        if (!isWeekendKey(key)) {
            keys.push(key);
        }
    }

    return keys;
}

export function formatDateLabel(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, (month ?? 1) - 1, day).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function minutesBetween(start: string, end: string): number {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    return (endHour ?? 0) * 60 + (endMinute ?? 0) - ((startHour ?? 0) * 60 + (startMinute ?? 0));
}

export function addMonths(dateKey: string, delta: number): string {
    const [year, month] = dateKey.split('-').map(Number);
    const date = new Date(year, (month ?? 1) - 1 + delta, 1);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-01`;
}

export function lastDateOfMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const last = new Date(year, month ?? 1, 0).getDate();

    return `${year}-${pad2(month ?? 1)}-${pad2(last)}`;
}

export function monthTitle(dateKey: string): string {
    const [year, month] = dateKey.split('-').map(Number);
    const date = new Date(year, (month ?? 1) - 1, 1);

    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

export type CalDay = {
    key: string;
    day: number;
    inMonth: boolean;
};

export function monthGrid(dateKey: string): CalDay[] {
    const [year, month] = dateKey.split('-').map(Number);
    const first = new Date(year, (month ?? 1) - 1, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month ?? 1, 0).getDate();
    const prevMonthDays = new Date(year, (month ?? 1) - 1, 0).getDate();
    const cells: CalDay[] = [];

    for (let i = 0; i < 42; i++) {
        const offset = i - startWeekday;
        if (offset < 0) {
            const day = prevMonthDays + offset + 1;
            const date = new Date(year, (month ?? 1) - 2, day);
            cells.push({
                key: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(day)}`,
                day,
                inMonth: false,
            });
        } else if (offset >= daysInMonth) {
            const day = offset - daysInMonth + 1;
            const date = new Date(year, month ?? 1, day);
            cells.push({
                key: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(day)}`,
                day,
                inMonth: false,
            });
        } else {
            const day = offset + 1;
            cells.push({
                key: `${year}-${pad2(month ?? 1)}-${pad2(day)}`,
                day,
                inMonth: true,
            });
        }
    }

    return cells;
}
