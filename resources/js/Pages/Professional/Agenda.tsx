import AppointmentDetailDialog from '@/Components/Appointments/AppointmentDetailDialog';
import AssignModal from '@/Components/Agenda/AssignModal';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { ConfirmDialog, useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import FieldError from '@/Components/Form/FieldError';
import Hint from '@/Components/Surfaces/Hint';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import { clinicHours, clockMinutes, useClinic } from '@/lib/clinic';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { overbookSlots } from '@/lib/overbook';
import { cn } from '@/lib/utils';
import type { AppointmentRecord, AvailabilityWindowRecord, ProfessionalRecord, Slot } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type PanelStep = 'day' | 'load';

type Props = {
    professional: ProfessionalRecord;
    selectedDate: string;
    panel: PanelStep;
    windows: AvailabilityWindowRecord[];
    slots: Slot[];
    appointments: AppointmentRecord[];
    tones: Record<string, 'empty' | 'has' | 'full'>;
    month: string;
    now: string;
};

type AgendaModal = 'load' | 'assign';

export default function Agenda({ professional, selectedDate, panel, windows, slots, appointments, tones, month: serverMonth, now }: Props) {
    const [month, setMonth] = useState(serverMonth);
    const requestedMonth = useRef(serverMonth);
    const [mobileDayOpen, setMobileDayOpen] = useState(panel !== 'day');
    const [modal, setModal] = useState<AgendaModal | null>(panel === 'load' ? 'load' : null);
    const [assignStartsAt, setAssignStartsAt] = useState<string | undefined>(undefined);

    const openAssign = (startsAt: string) => {
        setAssignStartsAt(startsAt);
        setModal('assign');
    };
    const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(null);
    const openAppointment = appointments.find((appointment) => appointment.id === openAppointmentId) ?? null;
    const { ask, dialog } = useConfirm();
    const clinic = useClinic();
    const hours = clinicHours(selectedDate, clinic);
    const openMinutes = clockMinutes(hours?.opensAt ?? clinic.opensAt);
    const closeMinutes = clockMinutes(hours?.closesAt ?? clinic.closesAt);
    const dayClosed = hours === null;
    const shortForm = useForm({ starts_at: '' });
    const sobreturnoSlots = useMemo(
        () =>
            overbookSlots({
                date: selectedDate,
                now,
                stepMinutes: professional.slot_duration_minutes,
                openMinutes,
                closeMinutes,
                dayOpen: !dayClosed,
                appointments,
                windows,
            }),
        [selectedDate, now, professional.slot_duration_minutes, openMinutes, closeMinutes, dayClosed, appointments, windows],
    );

    useEffect(() => {
        if (serverMonth === requestedMonth.current) {
            setMonth(serverMonth);
        }
    }, [serverMonth]);

    const go = (date: string) => {
        const nextMonth = `${date.slice(0, 7)}-01`;
        requestedMonth.current = nextMonth;
        setMonth(nextMonth);
        setMobileDayOpen(true);
        router.get('/profesional/agenda', { date, month: nextMonth }, { preserveState: true });
    };

    const changeMonth = (next: string) => {
        if (next === requestedMonth.current) {
            return;
        }
        requestedMonth.current = next;
        setMonth(next);
        router.get(
            '/profesional/agenda',
            { date: selectedDate, month: next, ...(panel === 'load' ? { panel } : {}) },
            { preserveState: true, preserveScroll: true, replace: true, only: ['tones', 'month'] },
        );
    };

    const closeModal = () => {
        setModal(null);
        shortForm.clearErrors();
        if (panel !== 'day') {
            router.get(
                '/profesional/agenda',
                { date: selectedDate, month },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }
    };

    const loadWindow = (startsAt: string) => {
        if (shortForm.processing) {
            return;
        }
        shortForm.transform(() => ({ starts_at: startsAt }));
        shortForm.post('/agenda/windows', { preserveScroll: true, onSuccess: () => setModal(null) });
    };

    const removeWindow = async (id: number) => {
        const ok = await ask({
            title: 'Borrar franja',
            message: '¿Borrar esta franja? Solo se puede si no tiene reservas.',
            confirmLabel: 'Borrar',
            danger: true,
        });
        if (ok) {
            router.delete(`/agenda/windows/${id}`, { preserveScroll: true });
        }
    };

    const dayLabel = formatDateLabel(selectedDate);
    const panelTitle = `Turnos de ${dayLabel.replace(/^./, (letter) => letter.toUpperCase())}`;

    const dayMeta = `${appointments.length} reserva${appointments.length === 1 ? '' : 's'} · ${slots.length} hueco${slots.length === 1 ? '' : 's'} libre${slots.length === 1 ? '' : 's'}.`;

    const renderCalendar = () => (
        <CalendarMonth
            month={month}
            selected={selectedDate}
            tones={tones}
            today={now}
            onSelect={go}
            onMonthChange={changeMonth}
            legend={[
                { tone: 'empty', label: 'Sin turnos' },
                { tone: 'has', label: 'Con turnos libres' },
                { tone: 'full', label: 'Sin turnos libres' },
            ]}
        />
    );

    const dayActions = (sticky: boolean) => (
        <div
            className={cn(
                'border-rule bg-paper mt-auto shrink-0 border-t pt-[var(--space-sm)]',
                sticky && 'sticky bottom-0 z-[6] -mx-[var(--space-sm)] px-[var(--space-sm)] pb-[0.65rem]',
            )}
        >
            <Btn type="button" block onClick={() => setModal('load')}>
                <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Cargar sobreturno
            </Btn>
        </div>
    );

    const panelBody = (opts: { stickyDayActions: boolean }) => (
        <>
            <Hint className="mt-[0.25rem] shrink-0">{dayMeta}</Hint>
            <DayTimeline
                className="mt-[var(--space-xs)] mb-[var(--space-sm)] min-h-[12rem] flex-1"
                date={selectedDate}
                now={now}
                stepMinutes={professional.slot_duration_minutes}
                bands={windows.map((window) => ({ key: window.id, starts_at: window.starts_at, ends_at: window.ends_at }))}
                blocks={appointments.map((appointment) => ({
                    key: appointment.id,
                    starts_at: appointment.starts_at,
                    ends_at: appointment.ends_at,
                    title: appointment.patient?.name ?? 'Paciente',
                    subtitle: appointment.specialty?.name,
                }))}
                onBlockSelect={(key) => setOpenAppointmentId(Number(key))}
                freeSlots={slots}
                onFreeSelect={openAssign}
            />
            {dayActions(opts.stickyDayActions)}
        </>
    );

    const loadModal =
        modal === 'load' ? (
            <ConfirmDialog title="Cargar sobreturno" message={dayLabel} onDismiss={closeModal} kind="workspace">
                <div className="flex min-h-0 flex-1 flex-col">
                    {shortForm.errors.starts_at || shortForm.errors.dates || shortForm.errors.ranges ? (
                        <FieldError className="shrink-0">
                            {shortForm.errors.starts_at || shortForm.errors.dates || shortForm.errors.ranges}
                        </FieldError>
                    ) : null}
                    <Hint className="m-0 shrink-0">
                        {dayClosed
                            ? 'El sanatorio no abre este día.'
                            : `Elegí un horario libre fuera de las franjas. El sanatorio atiende de ${hours?.opensAt ?? clinic.opensAt} a ${hours?.closesAt ?? clinic.closesAt}.`}
                    </Hint>
                    <DayTimeline
                        className={cn('mt-[var(--space-xs)] min-h-[12rem] flex-1', shortForm.processing && 'pointer-events-none opacity-60')}
                        date={selectedDate}
                        now={now}
                        stepMinutes={professional.slot_duration_minutes}
                        bands={windows.map((window) => ({ key: window.id, starts_at: window.starts_at, ends_at: window.ends_at }))}
                        blocks={appointments.map((appointment) => ({
                            key: appointment.id,
                            starts_at: appointment.starts_at,
                            ends_at: appointment.ends_at,
                            title: appointment.patient?.name ?? 'Paciente',
                            subtitle: appointment.specialty?.name,
                        }))}
                        freeSlots={sobreturnoSlots}
                        onFreeSelect={loadWindow}
                    />
                    {windows.length > 0 ? (
                        <PanelScroll className="pt-[var(--space-sm)]">
                            {windows.map((window) => (
                                <ListRow key={window.id}>
                                    <span>
                                        Franja {wallTime(window.starts_at)} — {wallTime(window.ends_at)}
                                    </span>
                                    <Btn
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 self-start"
                                        onClick={() => removeWindow(window.id)}
                                    >
                                        <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Borrar franja
                                    </Btn>
                                </ListRow>
                            ))}
                        </PanelScroll>
                    ) : null}
                </div>
            </ConfirmDialog>
        ) : null;

    return (
        <>
            <Head title="Mi agenda" />
            <PageScreen
                layout="split"
                header={
                    <PageHeader
                        title="Mi agenda"
                        description="Franjas, huecos y reservas del día. Elegí un día para ver el detalle."
                        actions={
                            <Btn asChild>
                                <Link href="/profesional/programar">
                                    <CalendarPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Programar horarios
                                </Link>
                            </Btn>
                        }
                    />
                }
            >
                <StageCard id="agenda-body">
                    <MobileDaySwap
                        dayOpen={mobileDayOpen}
                        onBackToCalendar={() => setMobileDayOpen(false)}
                        calendar={renderCalendar()}
                        panel={
                            <Panel title={panelTitle} className="h-full min-h-0 gap-0">
                                {panelBody({ stickyDayActions: true })}
                            </Panel>
                        }
                    />

                    <StageCard layout="split" className="max-md:!hidden">
                        {renderCalendar()}
                        <Panel title={panelTitle} className="gap-0">
                            {panelBody({ stickyDayActions: false })}
                        </Panel>
                    </StageCard>
                </StageCard>
            </PageScreen>
            {loadModal}
            {modal === 'assign' ? <AssignModal date={selectedDate} startsAt={assignStartsAt} onDismiss={() => setModal(null)} /> : null}
            {openAppointment ? (
                <AppointmentDetailDialog appointment={openAppointment} onDismiss={() => setOpenAppointmentId(null)} />
            ) : null}
            {dialog}
        </>
    );
}
