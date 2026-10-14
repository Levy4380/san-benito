import { Head, Link, router } from '@inertiajs/react';
import { Calendar, CalendarDays, History, NotebookPen, Undo2, X } from 'lucide-react';
import { useState } from 'react';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import WeekTimeline, { blocksOnDay } from '@/Components/Calendar/WeekTimeline';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ViewSwitch, { type ViewSwitchOption } from '@/Components/Common/ViewSwitch';
import { Btn } from '@/Components/Form/Btn';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import { ConfirmDialog, useConfirm } from '@/Components/Feedback/ConfirmModal';
import Empty from '@/Components/Surfaces/Empty';
import Panel from '@/Components/Surfaces/Panel';
import { BookingCardFields } from '@/Components/Surfaces/BookingCard';
import { formatDateLabel, wallDate } from '@/lib/datetime';
import type { AppointmentRecord } from '@/types';

type Props = {
    appointments: AppointmentRecord[];
    today: string;
    now: string;
};

const appointmentViews: readonly ViewSwitchOption<'week' | 'month'>[] = [
    { value: 'week', label: 'Semanal', icon: CalendarDays },
    { value: 'month', label: 'Mensual', icon: Calendar },
];

const defaultAppointmentView = 'week' satisfies 'week' | 'month';

export default function MyAppointments({ appointments, today, now }: Props) {
    const [mode, setMode] = useState<'week' | 'month'>(defaultAppointmentView);
    const { ask, dialog } = useConfirm();
    const days = appointments.map((appointment) => wallDate(appointment.starts_at));
    const tones = Object.fromEntries(days.map((day) => [day, 'has' as const]));
    const [month, setMonth] = useState((days[0] ?? today).slice(0, 7) + '-01');
    const [selected, setSelected] = useState<string | null>(days[0] ?? null);
    const [mobileDayOpen, setMobileDayOpen] = useState(false);
    const [openId, setOpenId] = useState<number | null>(null);
    const open = appointments.find((appointment) => appointment.id === openId) ?? null;

    const cancel = async (id: number) => {
        const ok = await ask({
            title: 'Cancelar turno',
            message: '¿Cancelar este turno? El horario volverá a estar disponible.',
            confirmLabel: 'Cancelar turno',
            danger: true,
        });
        if (ok) {
            router.delete(`/appointments/${id}`, { onSuccess: () => setOpenId(null) });
        }
    };

    const selectDay = (date: string) => {
        setSelected(date);
        setMobileDayOpen(true);
    };

    const calendar = (
        <CalendarMonth
            month={month}
            selected={selected}
            tones={tones}
            minDate={today}
            onSelect={selectDay}
            onMonthChange={setMonth}
            legend={[
                { tone: 'empty', label: 'Sin turnos' },
                { tone: 'has', label: 'Con turnos' },
            ]}
        />
    );

    const dayPanel = (sheet = false) => (
        <Panel className="h-full min-h-0" sheet={sheet} title={selected ? formatDateLabel(selected) : undefined}>
            {selected ? (
                <DayTimeline
                    className="mt-[var(--space-xs)] min-h-[12rem] flex-1"
                    date={selected}
                    now={now}
                    bands={[]}
                    blocks={blocksOnDay(appointments, selected)}
                    label={`Reservas del ${formatDateLabel(selected)}`}
                    onBlockSelect={(key) => setOpenId(Number(key))}
                />
            ) : (
                <Empty>No tenés turnos próximos.</Empty>
            )}
        </Panel>
    );

    return (
        <>
            <Head title="Mis turnos" />
            <PageScreen
                header={
                    <PageHeader
                        title="Mis turnos"
                        description="Tus reservas futuras."
                        actions={
                            <>
                                <ViewSwitch
                                    options={appointmentViews}
                                    defaultValue={defaultAppointmentView}
                                    value={mode}
                                    onChange={(next) => {
                                        setMode(next);
                                        if (next === 'month') {
                                            setMobileDayOpen(false);
                                        }
                                    }}
                                />
                                <Btn variant="outline" asChild>
                                    <Link href="/paciente/mis-turnos/historial">
                                        <History className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Historial de turnos
                                    </Link>
                                </Btn>
                                <Btn asChild>
                                    <Link href="/paciente/reserva">
                                        <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Reservar turno
                                    </Link>
                                </Btn>
                            </>
                        }
                    />
                }
            >
                <StageCard id="my-body">
                    {mode === 'month' ? (
                        <>
                            <MobileDaySwap
                                dayOpen={mobileDayOpen}
                                onBackToCalendar={() => setMobileDayOpen(false)}
                                backLabel="Mes"
                                calendar={calendar}
                                panel={dayPanel()}
                            />
                            <StageCard layout="split" className="max-md:!hidden">
                                <CalendarMonth
                                    month={month}
                                    selected={selected}
                                    tones={tones}
                                    minDate={today}
                                    onSelect={setSelected}
                                    onMonthChange={setMonth}
                                    legend={[
                                        { tone: 'empty', label: 'Sin turnos' },
                                        { tone: 'has', label: 'Con turnos' },
                                    ]}
                                />
                                {dayPanel(true)}
                            </StageCard>
                        </>
                    ) : (
                        <WeekTimeline today={today} now={now} appointments={appointments} onSelect={setOpenId} />
                    )}
                </StageCard>
            </PageScreen>
            {open ? (
                <ConfirmDialog title="Turno" onDismiss={() => setOpenId(null)}>
                    <BookingCardFields appointment={open} />
                    <div className="flex flex-wrap justify-end gap-[0.5rem]">
                        <Btn type="button" variant="outline" onClick={() => setOpenId(null)}>
                            <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Volver
                        </Btn>
                        <Btn type="button" variant="danger" onClick={() => cancel(open.id)}>
                            <X className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Cancelar turno
                        </Btn>
                    </div>
                </ConfirmDialog>
            ) : null}
            {dialog}
        </>
    );
}
