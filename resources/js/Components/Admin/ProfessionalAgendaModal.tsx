import AgendaDialog from '@/Components/Admin/AgendaDialog';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import TimelineAppointmentDialog from '@/Components/Calendar/TimelineAppointmentDialog';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import Empty from '@/Components/Surfaces/Empty';
import SlotRow from '@/Components/Surfaces/SlotRow';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { getJson } from '@/lib/json';
import { hasPermission, Permission } from '@/lib/permissions';
import type { AppointmentRecord, AvailabilityWindowRecord, ProfessionalRecord, SharedData, Slot } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { CalendarPlus, NotebookPen, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function ProfessionalAgendaModal({ professionalId, name, onDismiss }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [date, setDate] = useState<string | null>(null);
    const [month, setMonth] = useState('');
    const [data, setData] = useState<AgendaPayload | null>(null);
    const [failed, setFailed] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [assignStartsAt, setAssignStartsAt] = useState<string | undefined>(undefined);
    const [patientId, setPatientId] = useState('');
    const [specialtyId, setSpecialtyId] = useState<number | null>(null);
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
    const selectedDate = data?.selectedDate ?? null;
    const openAppointment = data?.timeline.appointments.find((appointment) => appointment.id === openAppointmentId) ?? null;
    const assigning = Boolean(data?.patients);
    const onlySpecialty = data && data.professional.specialties.length === 1 ? data.professional.specialties[0] : null;
    const selectedSpecialtyId = specialtyId ?? onlySpecialty?.id ?? null;

    const selectDay = (next: string) => {
        setDate(next);
    };

    const changeMonth = (next: string) => {
        setMonth(next);
        setDate(next);
    };

    const openBooking = (startsAt?: string) => {
        setAssignStartsAt(startsAt);
        setBookingOpen(true);
    };

    const closeBooking = () => {
        setBookingOpen(false);
        setAssignStartsAt(undefined);
        setPatientId('');
    };

    const book = (startsAt: string) => {
        if (!data || !selectedSpecialtyId || !patientId) {
            return;
        }

        router.post(
            `/professionals/${data.professional.id}/appointments`,
            {
                starts_at: startsAt,
                specialty_id: selectedSpecialtyId,
                patient_id: Number(patientId),
            },
            { onSuccess: closeBooking },
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
                {assigning ? (
                    <div className="flex shrink-0 justify-end pt-[var(--space-sm)]">
                        <Btn type="button" onClick={() => openBooking()}>
                            <CalendarPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Agendar turno
                        </Btn>
                    </div>
                ) : null}
            </div>
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
            {data && bookingOpen ? (
                <ConfirmDialog
                    title="Agendar turno"
                    message={[name, selectedDate ? formatDateLabel(selectedDate) : null, assignStartsAt ? `${wallTime(assignStartsAt)} hs` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    onDismiss={closeBooking}
                >
                    <div className="flex max-h-[60dvh] min-h-0 flex-col">
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
                        {assignStartsAt ? null : data.slots.length === 0 ? (
                            <Empty>No hay horarios en este día.</Empty>
                        ) : (
                            data.slots.map((slot) => (
                                <SlotRow key={slot.starts_at}>
                                    <strong>
                                        {wallTime(slot.starts_at)} — {wallTime(slot.ends_at)}
                                    </strong>
                                    <Btn
                                        type="button"
                                        size="sm"
                                        className="shrink-0"
                                        disabled={!selectedSpecialtyId || !patientId}
                                        onClick={() => book(slot.starts_at)}
                                    >
                                        <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Reservar
                                    </Btn>
                                </SlotRow>
                            ))
                        )}
                    </div>
                    <div className="flex justify-end gap-[0.55rem]">
                        {assignStartsAt ? (
                            <Btn
                                type="button"
                                className="min-w-[6.5rem]"
                                disabled={!selectedSpecialtyId || !patientId}
                                onClick={() => book(assignStartsAt)}
                            >
                                <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Reservar
                            </Btn>
                        ) : null}
                        <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={closeBooking}>
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
