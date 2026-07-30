import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { AppointmentsCalendar, formatDateLabel, toDateKey } from '@/components/appointments-calendar';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Time24Input } from '@/components/time-24-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatWallClockTime } from '@/lib/datetime';
import { type SharedData } from '@/types';

type Appointment = {
    id: number;
    starts_at: string;
    ends_at: string;
    status: 'available' | 'booked';
    patient?: { user: { name: string } } | null;
};

type SlotMode = 'classic' | 'range';

type Props = {
    doctor: {
        id: number;
        slot_duration_minutes: number;
    };
    appointments: Appointment[];
};

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

/** Build `Y-m-d H:i:s` from a calendar day + `HH:mm` in local time. */
function toDateTime(dateKey: string, time: string): string {
    const normalized = time.length === 5 ? `${time}:00` : time;

    return `${dateKey} ${normalized}`;
}

function endTimeLabel(dateKey: string, time: string, durationMinutes: number): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const end = new Date(year, month - 1, day, hour, minute + durationMinutes, 0);

    return `${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function minutesBetween(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export default function DoctorAgenda({ doctor, appointments }: Props) {
    const { errors } = usePage<SharedData>().props;
    const durationMinutes = doctor.slot_duration_minutes;
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [mode, setMode] = useState<SlotMode>('classic');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [processing, setProcessing] = useState(false);

    const byDate = useMemo(() => {
        const map = new Map<string, Appointment[]>();

        for (const appointment of appointments) {
            const key = toDateKey(appointment.starts_at);
            const list = map.get(key) ?? [];
            list.push(appointment);
            map.set(key, list);
        }

        for (const list of map.values()) {
            list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        }

        return map;
    }, [appointments]);

    const markedDates = useMemo(() => new Set(byDate.keys()), [byDate]);
    const dayAppointments = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

    const rangeSlotCount =
        mode === 'range' && startTime && endTime
            ? Math.floor(minutesBetween(startTime, endTime) / durationMinutes)
            : 0;

    const selectDate = (dateKey: string) => {
        setSelectedDate(dateKey);
        setStartTime('');
        setEndTime('');
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !startTime) {
            return;
        }

        if (mode === 'range' && !endTime) {
            return;
        }

        const payload =
            mode === 'classic'
                ? {
                      mode: 'classic' as const,
                      starts_at: toDateTime(selectedDate, startTime),
                  }
                : {
                      mode: 'range' as const,
                      starts_at: toDateTime(selectedDate, startTime),
                      ends_at: toDateTime(selectedDate, endTime),
                  };

        router.post(route('agenda.slots.store'), payload, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setStartTime('');
                setEndTime('');
            },
        });
    };

    const removeSlot = (id: number) => {
        if (confirm('¿Eliminar este horario disponible?')) {
            router.delete(route('agenda.slots.destroy', id), { preserveScroll: true });
        }
    };

    const cancel = (id: number) => {
        if (confirm('¿Cancelar este turno?')) {
            router.post(route('appointments.cancel', id), {}, { preserveScroll: true });
        }
    };

    const canSubmit =
        Boolean(startTime) && (mode === 'classic' || (Boolean(endTime) && rangeSlotCount > 0));

    return (
        <AppLayout breadcrumbs={[{ title: 'Mi agenda', href: '/agenda' }]}>
            <Head title="Mi agenda" />
            <div className="page-shell page-shell--wide">
                <PageHeader
                    title="Mi agenda"
                    description={`Elegí un día a la izquierda para ver y cargar turnos de ${durationMinutes} minutos.`}
                />

                <div className="agenda-layout">
                    <AppointmentsCalendar
                        markedDates={markedDates}
                        selectedDate={selectedDate}
                        onSelectDate={selectDate}
                    />

                    <section className="surface min-w-0">
                        {!selectedDate ? (
                            <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                Seleccioná un día del calendario para ver las franjas de ese día.
                            </p>
                        ) : (
                            <div className="grid gap-5">
                                <header className="border-b border-[var(--color-rule)] pb-4">
                                    <h2 className="font-display text-[length:var(--text-xl)] capitalize">
                                        {formatDateLabel(selectedDate)}
                                    </h2>
                                    <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                        {dayAppointments.length === 0
                                            ? 'Todavía no hay franjas este día. Agregá la primera abajo.'
                                            : `${dayAppointments.length} franja(s) este día.`}
                                    </p>
                                </header>

                                <div className="grid gap-3">
                                    {dayAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="rounded-[var(--radius-card)] border border-[var(--color-rule)] p-4"
                                        >
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <p className="font-display text-[length:var(--text-md)]">
                                                    {formatWallClockTime(appointment.starts_at)} —{' '}
                                                    {formatWallClockTime(appointment.ends_at)}
                                                </p>
                                                <span className="text-[length:var(--text-xs)] font-semibold tracking-wide text-[var(--color-ink-2)] uppercase">
                                                    {appointment.status === 'available'
                                                        ? 'Disponible'
                                                        : 'Reservado'}
                                                </span>
                                            </div>
                                            {appointment.status === 'booked' && appointment.patient && (
                                                <p className="mt-2 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                                    Paciente: {appointment.patient.user.name}
                                                </p>
                                            )}
                                            <div className="mt-3 flex gap-2">
                                                {appointment.status === 'available' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeSlot(appointment.id)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                                {appointment.status === 'booked' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => cancel(appointment.id)}
                                                    >
                                                        Cancelar turno
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form
                                    onSubmit={submit}
                                    className="grid gap-3 border-t border-[var(--color-rule)] pt-4"
                                >
                                    <div>
                                        <p className="font-display text-[length:var(--text-md)]">
                                            Agregar turno
                                        </p>
                                        <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                            Duración configurada: {durationMinutes} minutos.
                                        </p>
                                    </div>

                                    <fieldset className="grid gap-2">
                                        <legend className="sr-only">Tipo de alta</legend>
                                        <div className="flex flex-wrap gap-4">
                                            <label className="flex items-center gap-2 text-[length:var(--text-sm)]">
                                                <input
                                                    type="radio"
                                                    name="slot_mode"
                                                    value="classic"
                                                    checked={mode === 'classic'}
                                                    onChange={() => setMode('classic')}
                                                />
                                                Turno clásico
                                            </label>
                                            <label className="flex items-center gap-2 text-[length:var(--text-sm)]">
                                                <input
                                                    type="radio"
                                                    name="slot_mode"
                                                    value="range"
                                                    checked={mode === 'range'}
                                                    onChange={() => setMode('range')}
                                                />
                                                Franja de turnos
                                            </label>
                                        </div>
                                    </fieldset>

                                    <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                                        <div className="grid gap-2">
                                            <Label htmlFor="start_time">Hora de inicio</Label>
                                            <Time24Input
                                                id="start_time"
                                                value={startTime}
                                                onChange={setStartTime}
                                                required
                                            />
                                        </div>
                                        {mode === 'range' && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="end_time">Hora de fin</Label>
                                                <Time24Input
                                                    id="end_time"
                                                    value={endTime}
                                                    onChange={setEndTime}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <InputError
                                        message={
                                            (errors.starts_at as string | undefined) ||
                                            (errors.ends_at as string | undefined) ||
                                            (errors.mode as string | undefined)
                                        }
                                    />

                                    {mode === 'classic' && startTime && (
                                        <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                            Queda de {startTime} a{' '}
                                            {endTimeLabel(selectedDate, startTime, durationMinutes)}.
                                        </p>
                                    )}

                                    {mode === 'range' && startTime && endTime && (
                                        <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                            {rangeSlotCount > 0
                                                ? `Se crearán ${rangeSlotCount} turno${rangeSlotCount === 1 ? '' : 's'} de ${durationMinutes} min.`
                                                : `La franja es más corta que ${durationMinutes} minutos.`}
                                        </p>
                                    )}

                                    <div>
                                        <Button
                                            type="submit"
                                            disabled={processing || !canSubmit}
                                            className="whitespace-nowrap"
                                        >
                                            {mode === 'classic' ? 'Crear turno' : 'Crear franja'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
