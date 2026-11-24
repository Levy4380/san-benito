import AgendaDialog from '@/Components/Admin/AgendaDialog';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import TimelineAppointmentDialog from '@/Components/Calendar/TimelineAppointmentDialog';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import Hint from '@/Components/Surfaces/Hint';
import { clinicHours, clockMinutes, useClinic } from '@/lib/clinic';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { getJson } from '@/lib/json';
import { overbookSlots } from '@/lib/overbook';
import { hasPermission, Permission } from '@/lib/permissions';
import type { AppointmentRecord, AvailabilityWindowRecord, ProfessionalRecord, SharedData, Slot } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { CalendarPlus, Plus, Undo2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AgendaPayload = {
    professional: ProfessionalRecord;
    selectedDate: string;
    slots: Slot[];
    specialtyId: number | null;
    timeline: {
        windows: AvailabilityWindowRecord[];
        appointments: AppointmentRecord[];
        now: string;
    };
    bookingTones: Record<string, 'empty' | 'has'>;
    patients?: { id: number; name: string; dni: string }[];
};

type Props = {
    professionalId: number;
    name: string;
    onDismiss: () => void;
};

type FreeSlot = Slot & { label?: string };

export default function ProfessionalAgendaModal({ professionalId, name, onDismiss }: Props) {
    const { auth } = usePage<SharedData>().props;
    const clinic = useClinic();
    const [date, setDate] = useState<string | null>(null);
    const [month, setMonth] = useState('');
    const [data, setData] = useState<AgendaPayload | null>(null);
    const [failed, setFailed] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [overbookOpen, setOverbookOpen] = useState(false);
    const [assignStartsAt, setAssignStartsAt] = useState<string | undefined>(undefined);
    const [patientId, setPatientId] = useState('');
    const [specialtyId, setSpecialtyId] = useState<number | null>(null);
    const [pickHint, setPickHint] = useState<string | null>(null);
    const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const query = date ? `?date=${date}` : '';
        setFailed(false);

        getJson<AgendaPayload>(`/professionals/${professionalId}/agenda${query}`, controller.signal)
            .then((payload) => {
                setData(payload);
                setMonth(`${payload.selectedDate.slice(0, 7)}-01`);
                setSpecialtyId((current) => current ?? payload.specialtyId);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [professionalId, date]);

    const canCancel = hasPermission(auth.user?.permissions, Permission.AppointmentsCancel);
    const canProgram = hasPermission(auth.user?.permissions, Permission.AvailabilityProgram);
    const selectedDate = data?.selectedDate ?? null;
    const openAppointment = data?.timeline.appointments.find((appointment) => appointment.id === openAppointmentId) ?? null;
    const assigning = Boolean(data?.patients);
    const onlySpecialty = data && data.professional.specialties.length === 1 ? data.professional.specialties[0] : null;
    const selectedSpecialtyId = specialtyId ?? onlySpecialty?.id ?? null;
    const hours = selectedDate ? clinicHours(selectedDate, clinic) : null;
    const openMinutes = clockMinutes(hours?.opensAt ?? clinic.opensAt);
    const closeMinutes = clockMinutes(hours?.closesAt ?? clinic.closesAt);
    const dayOpen = hours !== null;

    const sobreturnoSlots = useMemo<FreeSlot[]>(() => {
        if (!data || !selectedDate) {
            return [];
        }

        const assign = data.slots.map((slot) => ({ ...slot, label: '+ Asignar turno' }));
        const overbook = overbookSlots({
            date: data.selectedDate,
            now: data.timeline.now,
            stepMinutes: data.professional.slot_duration_minutes,
            openMinutes,
            closeMinutes,
            dayOpen,
            appointments: data.timeline.appointments,
            windows: data.timeline.windows,
        });

        return [...assign, ...overbook].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    }, [data, selectedDate, openMinutes, closeMinutes, dayOpen]);

    const selectDay = (next: string) => {
        setDate(next);
    };

    const changeMonth = (next: string) => {
        setMonth(next);
        setDate(next);
    };

    const openBooking = (startsAt: string) => {
        setAssignStartsAt(startsAt);
        setBookingOpen(true);
        setPickHint(null);
    };

    const closeBooking = () => {
        setBookingOpen(false);
        setAssignStartsAt(undefined);
        setPatientId('');
        setPickHint(null);
    };

    const openOverbook = () => {
        setOverbookOpen(true);
        setPickHint(null);
    };

    const closeOverbook = () => {
        setOverbookOpen(false);
        setPatientId('');
        setPickHint(null);
    };

    const book = (startsAt: string, onDone: () => void) => {
        if (!data || !selectedSpecialtyId || !patientId) {
            setPickHint(!patientId ? 'Elegí un paciente.' : 'Elegí una especialidad.');
            return;
        }

        setPickHint(null);
        router.post(
            `/professionals/${data.professional.id}/appointments`,
            {
                starts_at: startsAt,
                specialty_id: selectedSpecialtyId,
                patient_id: Number(patientId),
            },
            { onSuccess: onDone },
        );
    };

    const panel =
        data && selectedDate ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <DayTimeline
                    className="mt-[var(--space-xs)] min-h-[12rem] flex-1"
                    date={selectedDate}
                    now={data.timeline.now}
                    stepMinutes={data.professional.slot_duration_minutes}
                    bands={data.timeline.windows.map((window) => ({
                        key: window.id,
                        starts_at: window.starts_at,
                        ends_at: window.ends_at,
                    }))}
                    blocks={data.timeline.appointments.map((appointment) => ({
                        key: appointment.id,
                        starts_at: appointment.starts_at,
                        ends_at: appointment.ends_at,
                        title: appointment.patient?.name ?? 'Paciente',
                        subtitle: appointment.specialty?.name,
                    }))}
                    onBlockSelect={(key) => setOpenAppointmentId(Number(key))}
                    freeSlots={assigning ? data.slots : undefined}
                    onFreeSelect={assigning ? openBooking : undefined}
                />
                {assigning || canProgram ? (
                    <div className="flex shrink-0 flex-wrap justify-end gap-[0.55rem] pt-[var(--space-sm)]">
                        {canProgram ? (
                            <Btn asChild variant="outline">
                                <Link href={`/admin/profesionales/${professionalId}/programar`}>
                                    <CalendarPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Programar horarios
                                </Link>
                            </Btn>
                        ) : null}
                        {assigning ? (
                            <Btn type="button" onClick={openOverbook}>
                                <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Cargar sobreturno
                            </Btn>
                        ) : null}
                    </div>
                ) : null}
            </div>
        ) : null;

    const selectors = data ? (
        <>
            {onlySpecialty ? null : (
                <Field label="Especialidad" htmlFor="agenda_specialty_id" className="shrink-0">
                    <Combobox
                        id="agenda_specialty_id"
                        value={selectedSpecialtyId != null ? String(selectedSpecialtyId) : ''}
                        placeholder="Elegí una especialidad"
                        onChange={(value) => setSpecialtyId(value ? Number(value) : null)}
                        options={[
                            { value: '', label: 'Elegí una especialidad' },
                            ...data.professional.specialties.map((specialty) => ({
                                value: String(specialty.id),
                                label: specialty.name,
                            })),
                        ]}
                    />
                </Field>
            )}
            {data.patients ? (
                <Field label="Paciente" htmlFor="agenda_patient_id" className="shrink-0">
                    <Combobox
                        id="agenda_patient_id"
                        value={patientId}
                        placeholder="Elegí un paciente"
                        searchLabel="Buscar por nombre o DNI"
                        onChange={setPatientId}
                        options={[
                            { value: '', label: 'Elegí un paciente' },
                            ...data.patients.map((patient) => ({
                                value: String(patient.id),
                                label: `${patient.name} · DNI ${patient.dni}`,
                            })),
                        ]}
                    />
                </Field>
            ) : null}
        </>
    ) : null;

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
                    { tone: 'empty', label: 'Sin reservas' },
                    { tone: 'has', label: 'Con reservas' },
                ]}
                onSelect={selectDay}
                onMonthChange={changeMonth}
                panelTitle={selectedDate ? `Agenda del ${formatDateLabel(selectedDate)}` : undefined}
                panel={panel}
            />
            {data && bookingOpen && assignStartsAt ? (
                <ConfirmDialog
                    title="Asignar turno"
                    message={`${formatDateLabel(data.selectedDate)} · ${wallTime(assignStartsAt)} hs`}
                    onDismiss={closeBooking}
                    kind="info"
                >
                    <div className="flex max-h-[60dvh] min-h-0 flex-col gap-[var(--space-sm)]">
                        {selectors}
                        {pickHint ? <Hint className="m-0 text-danger">{pickHint}</Hint> : null}
                    </div>
                    <div className="flex justify-end gap-[0.55rem]">
                        <Btn type="button" className="min-w-[6.5rem]" onClick={() => book(assignStartsAt, closeBooking)}>
                            <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Asignar turno
                        </Btn>
                        <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={closeBooking}>
                            <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Volver
                        </Btn>
                    </div>
                </ConfirmDialog>
            ) : null}
            {data && overbookOpen && selectedDate ? (
                <ConfirmDialog title="Cargar sobreturno" message={formatDateLabel(selectedDate)} onDismiss={closeOverbook} kind="workspace">
                    <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-sm)]">
                        {selectors}
                        {pickHint ? <Hint className="m-0 text-danger">{pickHint}</Hint> : null}
                        <DayTimeline
                            className="min-h-[12rem] flex-1"
                            date={selectedDate}
                            now={data.timeline.now}
                            stepMinutes={data.professional.slot_duration_minutes}
                            bands={data.timeline.windows.map((window) => ({
                                key: window.id,
                                starts_at: window.starts_at,
                                ends_at: window.ends_at,
                            }))}
                            blocks={data.timeline.appointments.map((appointment) => ({
                                key: appointment.id,
                                starts_at: appointment.starts_at,
                                ends_at: appointment.ends_at,
                                title: appointment.patient?.name ?? 'Paciente',
                                subtitle: appointment.specialty?.name,
                            }))}
                            freeSlots={sobreturnoSlots}
                            onFreeSelect={(startsAt) => book(startsAt, closeOverbook)}
                        />
                    </div>
                    <div className="flex justify-end gap-[0.55rem]">
                        <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={closeOverbook}>
                            <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Volver
                        </Btn>
                    </div>
                </ConfirmDialog>
            ) : null}
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
