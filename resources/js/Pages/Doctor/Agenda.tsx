import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import BackLink from '@/Components/Common/BackLink';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import PatientProfileBtn from '@/Components/Common/PatientProfileBtn';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import BookingCard, { BookingCardActions, BookingCardFields, BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import Field from '@/Components/Form/Field';
import ListRow from '@/Components/Surfaces/ListRow';
import NativeSelect from '@/Components/Form/NativeSelect';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import SlotRow from '@/Components/Surfaces/SlotRow';
import Surface from '@/Components/Surfaces/Surface';
import Time24 from '@/Components/Form/Time24';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { AppointmentRecord, AvailabilityWindowRecord, DoctorRecord, PatientRecord, Slot } from '@/types';

type PanelStep = 'day' | 'load' | 'assign';

type Props = {
    doctor: DoctorRecord;
    selectedDate: string;
    panel: PanelStep;
    windows: AvailabilityWindowRecord[];
    slots: Slot[];
    appointments: AppointmentRecord[];
    tones: Record<string, 'empty' | 'has' | 'full'>;
    patients: PatientRecord[];
    preselectedPatient: PatientRecord | null;
};

function agendaHref(date: string, panel: PanelStep = 'day', patientId?: string) {
    const params = new URLSearchParams({ date });

    if (panel !== 'day') {
        params.set('panel', panel);
    }

    if (panel === 'assign' && patientId) {
        params.set('patient_id', patientId);
    }

    return `/agenda?${params.toString()}`;
}

export default function Agenda({ doctor, selectedDate, panel, windows, slots, appointments, tones, patients, preselectedPatient }: Props) {
    const [month, setMonth] = useState(selectedDate.slice(0, 7) + '-01');
    const [mobileDayOpen, setMobileDayOpen] = useState(panel !== 'day' || Boolean(preselectedPatient));
    const [patientId, setPatientId] = useState(preselectedPatient?.id?.toString() ?? '');
    const [specialtyId, setSpecialtyId] = useState(doctor.specialties.length === 1 ? String(doctor.specialties[0].id) : '');
    const [start, setStart] = useState('09:00');
    const { ask, dialog } = useConfirm();
    const shortForm = useForm({ starts_at: `${selectedDate} ${start}:00` });

    const go = (date: string) => {
        setMobileDayOpen(true);
        router.get('/agenda', { date }, { preserveState: true });
    };

    const assign = (startsAt: string) => {
        if (!patientId || !specialtyId) {
            return;
        }
        router.post('/agenda/appointments', {
            starts_at: startsAt,
            patient_id: Number(patientId),
            specialty_id: Number(specialtyId),
        });
    };

    const cancel = async (id: number) => {
        const ok = await ask({
            title: 'Cancelar turno',
            message: '¿Cancelar este turno? El horario volverá a estar disponible.',
            confirmLabel: 'Cancelar turno',
            danger: true,
        });
        if (ok) {
            router.delete(`/appointments/${id}`);
        }
    };

    const removeWindow = async (id: number) => {
        const ok = await ask({
            title: 'Borrar franja',
            message: '¿Borrar esta franja? Solo se puede si no tiene reservas.',
            confirmLabel: 'Borrar',
            danger: true,
        });
        if (ok) {
            router.delete(`/agenda/windows/${id}`);
        }
    };

    const panelTitle =
        panel === 'load'
            ? 'Cargar un turno'
            : panel === 'assign'
              ? 'Asignar turno'
              : `Turnos de ${formatDateLabel(selectedDate).replace(/^./, (letter) => letter.toUpperCase())}`;

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

    const dayActions = (sticky: boolean) =>
        panel === 'day' ? (
            <div
                className={cn(
                    'mt-auto grid shrink-0 grid-cols-2 gap-[0.55rem] border-t border-rule bg-paper pt-[var(--space-sm)]',
                    sticky && 'sticky bottom-0 z-[6] -mx-[var(--space-sm)] px-[var(--space-sm)] pb-[0.65rem]',
                )}
            >
                <Btn block asChild>
                    <Link href={agendaHref(selectedDate, 'load')} preserveState>
                        <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Cargar un turno
                    </Link>
                </Btn>
                <Btn variant="outline" block asChild>
                    <Link href={agendaHref(selectedDate, 'assign')} preserveState>
                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Asignar turno
                    </Link>
                </Btn>
            </div>
        ) : null;

    const panelBody = (opts: { stickyDayActions: boolean }): ReactNode => (
        <>
            {panel === 'day' ? (
                <>
                    <Hint className="mt-[0.25rem] shrink-0">{dayMeta}</Hint>
                    <BookingList>
                        {appointments.length === 0 ? (
                            <Empty>Sin reservas este día.</Empty>
                        ) : (
                            appointments.map((appointment) => (
                                <BookingCard key={appointment.id}>
                                    <BookingCardRow>
                                        <BookingCardFields appointment={appointment} />
                                        <BookingCardActions>
                                            <PatientProfileBtn
                                                patientId={appointment.patient_id}
                                                name={appointment.patient?.user.name}
                                                size="xs"
                                                label="Ver paciente"
                                            />
                                            <Btn type="button" variant="danger" size="xs" onClick={() => cancel(appointment.id)}>
                                                <X className="size-3 shrink-0" aria-hidden strokeWidth={2} />
                                                Cancelar turno
                                            </Btn>
                                        </BookingCardActions>
                                    </BookingCardRow>
                                </BookingCard>
                            ))
                        )}
                    </BookingList>
                    {dayActions(opts.stickyDayActions)}
                </>
            ) : null}
            {panel === 'load' ? (
                <>
                    <BackLink className="mb-[var(--space-sm)] shrink-0 self-start" href={agendaHref(selectedDate)}>
                        Atrás
                    </BackLink>
                    <Surface
                        as="form"
                        className="shrink-0 gap-[var(--space-sm)]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            shortForm.setData('starts_at', `${selectedDate} ${start}:00`);
                            shortForm.post('/agenda/windows');
                        }}
                    >
                        <div className="flex min-w-0 items-start justify-between gap-[0.65rem]">
                            <h3 className="m-0 min-w-0 flex-1 leading-[1.25]">Cargar un turno</h3>
                            <Btn type="submit" size="sm" className="shrink-0 self-start" disabled={shortForm.processing}>
                                <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Cargar un turno
                            </Btn>
                        </div>
                        <Field label="Hora de inicio" flush>
                            <Time24 value={start} onChange={setStart} />
                        </Field>
                    </Surface>
                    <PanelScroll className="pt-[var(--space-sm)]">
                        {windows.map((window) => (
                            <ListRow key={window.id}>
                                <span>
                                    Franja {wallTime(window.starts_at)} — {wallTime(window.ends_at)}
                                </span>
                                <Btn type="button" variant="outline" size="sm" className="shrink-0 self-start" onClick={() => removeWindow(window.id)}>
                                    <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Borrar franja
                                </Btn>
                            </ListRow>
                        ))}
                    </PanelScroll>
                </>
            ) : null}
            {panel === 'assign' ? (
                <>
                    <BackLink className="mb-[var(--space-sm)] shrink-0 self-start" href={agendaHref(selectedDate)}>
                        Atrás
                    </BackLink>
                    {preselectedPatient && patientId === String(preselectedPatient.id) ? (
                        <Hint className="mb-[var(--space-sm)] shrink-0">
                            Asignando turno a <strong className="text-ink">{preselectedPatient.user.name}</strong>. Elegí un horario disponible.
                        </Hint>
                    ) : null}
                    <Field label="Paciente vinculado" htmlFor="patient_id" className="shrink-0">
                        <div className="flex min-w-0 items-center gap-[0.5rem]">
                            <NativeSelect
                                id="patient_id"
                                className="min-w-0 flex-1"
                                value={patientId}
                                onChange={(event) => setPatientId(event.target.value)}
                            >
                                <option value="">Elegí un paciente</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.user.name}
                                    </option>
                                ))}
                            </NativeSelect>
                            {patientId ? (
                                <PatientProfileBtn
                                    patientId={Number(patientId)}
                                    name={patients.find((patient) => String(patient.id) === patientId)?.user.name}
                                />
                            ) : null}
                        </div>
                    </Field>
                    <Field label="Especialidad" htmlFor="specialty_id" className="shrink-0">
                        <NativeSelect id="specialty_id" value={specialtyId} onChange={(event) => setSpecialtyId(event.target.value)}>
                            <option value="">Elegí una especialidad</option>
                            {doctor.specialties.map((specialty) => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                    <PanelScroll className="pt-0">
                        {slots.length === 0 ? (
                            <Empty>No hay huecos libres este día.</Empty>
                        ) : (
                            slots.map((slot) => (
                                <SlotRow key={slot.starts_at}>
                                    <strong>
                                        {wallTime(slot.starts_at)} — {wallTime(slot.ends_at)}
                                    </strong>
                                    <Btn
                                        type="button"
                                        size="sm"
                                        className="shrink-0"
                                        disabled={!patientId || !specialtyId}
                                        onClick={() => assign(slot.starts_at)}
                                    >
                                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Asignar
                                    </Btn>
                                </SlotRow>
                            ))
                        )}
                    </PanelScroll>
                </>
            ) : null}
        </>
    );

    return (
        <>
            <Head title="Mi agenda" />
            <PageScreen
                layout="split"
                header={
                    <PageHeader
                        title="Mi agenda"
                        description="Franjas, huecos y reservas del día."
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
                        onBackToCalendar={() => {
                            setMobileDayOpen(false);
                            if (panel !== 'day') {
                                router.get('/agenda', { date: selectedDate }, { preserveState: true });
                            }
                        }}
                        calendar={renderCalendar()}
                        panel={
                            <Panel title={panel === 'day' ? panelTitle : undefined} className="h-full min-h-0 gap-0">
                                {panelBody({ stickyDayActions: true })}
                            </Panel>
                        }
                    />

                    <StageCard layout="split" className="max-md:!hidden">
                        {renderCalendar()}
                        <Panel title={panel === 'day' ? panelTitle : undefined} className="gap-0">
                            {panelBody({ stickyDayActions: false })}
                        </Panel>
                    </StageCard>
                </StageCard>
            </PageScreen>
            {dialog}
        </>
    );
}
