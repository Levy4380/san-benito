import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import { ConfirmDialog, useConfirm } from '@/Components/Feedback/ConfirmModal';
import FieldError from '@/Components/Form/FieldError';
import Empty from '@/Components/Surfaces/Empty';
import { clinicHours, clockMinutes, useClinic } from '@/lib/clinic';
import { formatDateLabel, wallDate, wallTime } from '@/lib/datetime';
import { getJson } from '@/lib/json';
import { overbookSlots } from '@/lib/overbook';
import { cn } from '@/lib/utils';
import type { AppointmentRecord, AvailabilityWindowRecord, Slot } from '@/types';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type RescheduleOptions = {
    date: string;
    today: string;
    slots: Slot[];
    slotMinutes: number;
    timeline: { windows: AvailabilityWindowRecord[]; appointments: AppointmentRecord[]; now: string };
    tones: Record<string, 'empty' | 'has' | 'full'>;
    /** Staff: also offer sobreturnos outside every window. */
    overbook: boolean;
};

type Props = {
    appointment: AppointmentRecord;
    onDismiss: () => void;
    /** After the move succeeds (JSON-fed screens refetch here). */
    onRescheduled?: () => void;
};

/**
 * Reprogramar turno (d51): same professional and specialty, another free slot.
 * Staff also gets «+ Sobreturno» blocks outside the windows (same grid as the staff agenda).
 */
export default function RescheduleAppointmentModal({ appointment, onDismiss, onRescheduled }: Props) {
    const clinic = useClinic();
    const { ask, dialog } = useConfirm();
    const [day, setDay] = useState(wallDate(appointment.starts_at));
    const [month, setMonth] = useState(`${wallDate(appointment.starts_at).slice(0, 7)}-01`);
    const [options, setOptions] = useState<RescheduleOptions | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoadFailed(false);

        getJson<RescheduleOptions>(`/appointments/${appointment.id}/reschedule-options?date=${day}&month=${month}`, controller.signal)
            .then(setOptions)
            .catch(() => {
                if (!controller.signal.aborted) {
                    setLoadFailed(true);
                }
            });

        return () => controller.abort();
    }, [appointment.id, day, month]);

    const dayReady = options !== null && options.date === day;

    const freeSlots = useMemo(() => {
        if (!options || !dayReady) {
            return [];
        }

        const free = options.slots.map((slot) => ({ ...slot, label: '+ Mover acá' }));

        if (!options.overbook) {
            return free;
        }

        const hours = clinicHours(options.date, clinic);
        const overbook = overbookSlots({
            date: options.date,
            now: options.timeline.now,
            stepMinutes: options.slotMinutes,
            openMinutes: clockMinutes(hours?.opensAt ?? clinic.opensAt),
            closeMinutes: clockMinutes(hours?.closesAt ?? clinic.closesAt),
            dayOpen: hours !== null,
            appointments: options.timeline.appointments,
            windows: options.timeline.windows,
        });

        return [...free, ...overbook].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    }, [options, dayReady, clinic]);

    const move = async (startsAt: string) => {
        const ok = await ask({
            title: 'Reprogramar turno',
            message: `¿Mover el turno de ${appointment.patient?.name ?? 'este paciente'} al ${formatDateLabel(wallDate(startsAt))} a las ${wallTime(startsAt)}?`,
            confirmLabel: 'Reprogramar',
        });
        if (!ok) {
            return;
        }

        setError(null);
        router.patch(
            `/appointments/${appointment.id}/reschedule`,
            { starts_at: startsAt },
            {
                preserveScroll: true,
                onStart: () => setSubmitting(true),
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    onRescheduled?.();
                    onDismiss();
                },
                onError: (errors) => setError(Object.values(errors)[0] ?? 'No se pudo reprogramar el turno.'),
            },
        );
    };

    const current = `${formatDateLabel(wallDate(appointment.starts_at))} · ${wallTime(appointment.starts_at)}–${wallTime(appointment.ends_at)}`;

    return (
        <>
            <ConfirmDialog
                title="Reprogramar turno"
                message={`${appointment.patient?.name ?? 'Paciente'} · hoy: ${current}. Elegí un día y un horario libre.`}
                onDismiss={onDismiss}
                kind="workspace"
            >
                {error ? <FieldError className="shrink-0">{error}</FieldError> : null}
                {loadFailed ? (
                    <Empty>No se pudieron cargar los horarios.</Empty>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-sm)] md:grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                        <div className="h-[min(16rem,34dvh)] min-h-[12rem] shrink-0 md:h-auto">
                            <CalendarMonth
                                month={month}
                                selected={day}
                                tones={options?.tones ?? {}}
                                today={options?.today}
                                minDate={options?.today}
                                onSelect={(value) => {
                                    setDay(value);
                                    setError(null);
                                }}
                                onMonthChange={setMonth}
                                legend={[
                                    { tone: 'empty', label: 'Sin turnos' },
                                    { tone: 'has', label: 'Con turnos libres' },
                                    { tone: 'full', label: 'Sin turnos libres' },
                                ]}
                            />
                        </div>
                        <DayTimeline
                            className={cn('min-h-[12rem] flex-1', submitting && 'pointer-events-none opacity-60')}
                            date={day}
                            now={dayReady ? options.timeline.now : undefined}
                            stepMinutes={options?.slotMinutes ?? 20}
                            label={`Horarios del ${formatDateLabel(day)}`}
                            bands={
                                dayReady
                                    ? options.timeline.windows.map((window) => ({
                                          key: window.id,
                                          starts_at: window.starts_at,
                                          ends_at: window.ends_at,
                                      }))
                                    : []
                            }
                            blocks={
                                dayReady
                                    ? options.timeline.appointments.map((item) => ({
                                          key: item.id,
                                          starts_at: item.starts_at,
                                          ends_at: item.ends_at,
                                          title: item.id === appointment.id ? `Turno actual · ${item.patient?.name ?? 'Paciente'}` : (item.patient?.name ?? 'Paciente'),
                                          subtitle: item.specialty?.name,
                                      }))
                                    : []
                            }
                            freeSlots={freeSlots}
                            onFreeSelect={move}
                        />
                    </div>
                )}
            </ConfirmDialog>
            {dialog}
        </>
    );
}
