import AssignModal from '@/Components/Agenda/AssignModal';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import TimelineAppointmentDialog from '@/Components/Calendar/TimelineAppointmentDialog';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { ConfirmDialog, useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import Time24 from '@/Components/Form/Time24';
import Hint from '@/Components/Surfaces/Hint';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { AppointmentRecord, AvailabilityWindowRecord, DoctorRecord, Slot } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Plus, Trash2, Undo2, UserPlus } from 'lucide-react';
import { useState } from 'react';

type PanelStep = 'day' | 'load';

type Props = {
    doctor: DoctorRecord;
    selectedDate: string;
    panel: PanelStep;
    windows: AvailabilityWindowRecord[];
    slots: Slot[];
    appointments: AppointmentRecord[];
    tones: Record<string, 'empty' | 'has' | 'full'>;
    now: string;
};

type AgendaModal = 'load' | 'assign';

export default function Agenda({ doctor, selectedDate, panel, windows, slots, appointments, tones, now }: Props) {
    const [month, setMonth] = useState(selectedDate.slice(0, 7) + '-01');
    const [mobileDayOpen, setMobileDayOpen] = useState(panel !== 'day');
    const [modal, setModal] = useState<AgendaModal | null>(panel === 'load' ? 'load' : null);
    const [assignStartsAt, setAssignStartsAt] = useState<string | undefined>(undefined);

    const openAssign = (startsAt?: string) => {
        setAssignStartsAt(startsAt);
        setModal('assign');
    };
    const [start, setStart] = useState('09:00');
    const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(null);
    const openAppointment = appointments.find((appointment) => appointment.id === openAppointmentId) ?? null;
    const { ask, dialog } = useConfirm();
    const shortForm = useForm({ starts_at: `${selectedDate} ${start}:00` });

    const go = (date: string) => {
        setMobileDayOpen(true);
        router.get('/agenda', { date }, { preserveState: true });
    };

    const closeModal = () => {
        setModal(null);
        shortForm.clearErrors();
        if (panel !== 'day') {
            router.get('/agenda', { date: selectedDate }, { preserveState: true, preserveScroll: true, replace: true });
        }
    };

    const loadWindow = () => {
        shortForm.transform(() => ({ starts_at: `${selectedDate} ${start}:00` }));
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
            onSelect={go}
            onMonthChange={setMonth}
            legend={[
                { tone: 'empty', label: 'Sin turnos' },
                { tone: 'has', label: 'Con turnos libres' },
                { tone: 'full', label: 'Todo reservado' },
            ]}
        />
    );

    const dayActions = (sticky: boolean) => (
        <div
            className={cn(
                'border-rule bg-paper mt-auto grid shrink-0 grid-cols-2 gap-[0.55rem] border-t pt-[var(--space-sm)]',
                sticky && 'sticky bottom-0 z-[6] -mx-[var(--space-sm)] px-[var(--space-sm)] pb-[0.65rem]',
            )}
        >
            <Btn type="button" block onClick={() => setModal('load')}>
                <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Cargar un turno
            </Btn>
            <Btn type="button" variant="outline" block onClick={() => openAssign()}>
                <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Asignar turno
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
                stepMinutes={doctor.slot_duration_minutes}
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

    const modalFooter = (
        <div className="flex justify-end">
            <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={closeModal}>
                <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Volver
            </Btn>
        </div>
    );

    const loadModal =
        modal === 'load' ? (
            <ConfirmDialog title="Cargar un turno" message={dayLabel} onDismiss={closeModal}>
                <div className="flex max-h-[60dvh] min-h-0 flex-col">
                    <form
                        className="flex shrink-0 items-end gap-[0.65rem]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadWindow();
                        }}
                    >
                        <Field label="Hora de inicio" error={shortForm.errors.starts_at} flush className="min-w-0 flex-1">
                            <Time24 value={start} onChange={setStart} />
                        </Field>
                        <Btn type="submit" className="shrink-0" disabled={shortForm.processing}>
                            <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Cargar
                        </Btn>
                    </form>
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
                {modalFooter}
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
                                <Link href="/agenda/program">
                                    <CalendarPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Programar turnos
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
                <TimelineAppointmentDialog
                    appointment={openAppointment}
                    profileHref={`/my-patients/${openAppointment.patient_id}`}
                    canCancel
                    onDismiss={() => setOpenAppointmentId(null)}
                />
            ) : null}
            {dialog}
        </>
    );
}
