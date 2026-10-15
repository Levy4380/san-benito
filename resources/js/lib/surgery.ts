export const SURGERY_STATUS_LABEL = {
    pending: 'Pendiente de aprobación',
    requested: 'Solicitada',
    to_schedule: 'A programar',
    scheduled: 'Programada',
} as const;

export function surgeryRange(startsAt: string, endsAt: string): string {
    return `${startsAt.slice(11, 16)}–${endsAt.slice(11, 16)}`;
}

export function surgeryShortDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, (month ?? 1) - 1, day).toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}
