import AgendaDialog from '@/Components/Admin/AgendaDialog';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import TimelineAppointmentDialog from '@/Components/Calendar/TimelineAppointmentDialog';
import { formatDateLabel } from '@/lib/datetime';
import { getJson } from '@/lib/json';
import { hasPermission, Permission } from '@/lib/permissions';
import type { AppointmentRecord, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type AgendaPayload = {
    selectedDate: string;
    bookingTones: Record<string, 'empty' | 'has'>;
    timeline: {
        appointments: AppointmentRecord[];
        now: string;
    };
};

type Props = {
    patientId: number;
    name: string;
    onDismiss: () => void;
};

export default function PatientAgendaModal({ patientId, name, onDismiss }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [date, setDate] = useState<string | null>(null);
    const [month, setMonth] = useState('');
    const [data, setData] = useState<AgendaPayload | null>(null);
    const [failed, setFailed] = useState(false);
    const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(null);
    const canCancel = hasPermission(auth.user?.permissions, Permission.AppointmentsCancel);

    useEffect(() => {
        const controller = new AbortController();
        const query = date ? `?date=${date}` : '';
        setFailed(false);

        getJson<AgendaPayload>(`/patients/${patientId}/agenda${query}`, controller.signal)
            .then((payload) => {
                setData(payload);
                setMonth(`${payload.selectedDate.slice(0, 7)}-01`);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [patientId, date]);

    const selectedDate = data?.selectedDate ?? null;
    const openAppointment = data?.timeline.appointments.find((appointment) => appointment.id === openAppointmentId) ?? null;

    return (
        <>
            <AgendaDialog
                title={`Agenda de ${name}`}
                message={selectedDate ? formatDateLabel(selectedDate) : undefined}
                onDismiss={onDismiss}
                failed={failed}
                month={month}
                selected={selectedDate}
                tones={data?.bookingTones ?? {}}
                today={data?.timeline.now}
                legend={[
                    { tone: 'empty', label: 'Sin turnos' },
                    { tone: 'has', label: 'Con turnos' },
                ]}
                onSelect={setDate}
                onMonthChange={(next) => {
                    setMonth(next);
                    setDate(next);
                }}
                panelTitle={selectedDate ? `Turnos del ${formatDateLabel(selectedDate)}` : undefined}
                panel={
                    data && selectedDate ? (
                        <DayTimeline
                            className="mt-[var(--space-xs)] min-h-[12rem] flex-1"
                            date={selectedDate}
                            now={data.timeline.now}
                            stepMinutes={20}
                            bands={[]}
                            blocks={data.timeline.appointments.map((appointment) => ({
                                key: appointment.id,
                                starts_at: appointment.starts_at,
                                ends_at: appointment.ends_at,
                                title: appointment.professional?.user.name ?? 'Profesional',
                                subtitle: appointment.specialty?.name,
                            }))}
                            onBlockSelect={(key) => setOpenAppointmentId(Number(key))}
                        />
                    ) : null
                }
            />
            {openAppointment ? (
                <TimelineAppointmentDialog
                    appointment={openAppointment}
                    canCancel={canCancel}
                    cancelHref={`/appointments/${openAppointment.id}`}
                    onDismiss={() => setOpenAppointmentId(null)}
                />
            ) : null}
        </>
    );
}
