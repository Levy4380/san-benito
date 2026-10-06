import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import TimelineAppointmentDialog from '@/Components/Calendar/TimelineAppointmentDialog';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import SlotRow from '@/Components/Surfaces/SlotRow';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { hasPermission, Permission } from '@/lib/permissions';
import type { AppointmentRecord, AvailabilityWindowRecord, DoctorRecord, SharedData, Slot } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CalendarPlus, NotebookPen, Undo2 } from 'lucide-react';
import { useState } from 'react';

type Props = {
    doctor: DoctorRecord;
    selectedDate: string | null;
    daysWithSlots: string[];
    slots: Slot[];
    previewDays: string[];
    specialtyId: number | null;
    timeline?: {
        windows: AvailabilityWindowRecord[];
        appointments: AppointmentRecord[];
        now: string;
    };
    bookingTones?: Record<string, 'empty' | 'has'>;
    patients?: { id: number; name: string; dni: string }[];
};

export default function DoctorSlots({
    doctor,
    selectedDate,
    daysWithSlots,
    slots,
    previewDays,
    specialtyId,
    timeline,
    bookingTones,
    patients,
}: Props) {
    const [month, setMonth] = useState((selectedDate ?? previewDays[0] ?? new Date().toISOString().slice(0, 10)).slice(0, 7) + '-01');
    const [mobileDayOpen, setMobileDayOpen] = useState(Boolean(selectedDate));
    const [bookingOpen, setBookingOpen] = useState(false);
    const [patientId, setPatientId] = useState('');
    const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(null);
    const { auth } = usePage<SharedData>().props;
    const canViewPatient = hasPermission(auth.user?.permissions, Permission.PatientsCatalogView);
    const canCancel = hasPermission(auth.user?.permissions, Permission.AppointmentsCancel);
    const staffDay = timeline && selectedDate ? { date: selectedDate, ...timeline } : null;
    const openAppointment = staffDay?.appointments.find((appointment) => appointment.id === openAppointmentId) ?? null;
    const assigning = Boolean(staffDay && patients);
    const tones = staffDay ? (bookingTones ?? {}) : Object.fromEntries(daysWithSlots.map((day) => [day, 'has' as const]));
    const legend = staffDay
        ? [
              { tone: 'empty' as const, label: 'Sin reservas' },
              { tone: 'has' as const, label: 'Con reservas' },
          ]
        : [
              { tone: 'empty' as const, label: 'Sin turnos' },
              { tone: 'has' as const, label: 'Con turnos' },
          ];
    const onlySpecialty = doctor.specialties.length === 1 ? doctor.specialties[0] : null;
    const selectedSpecialtyId = specialtyId ?? onlySpecialty?.id ?? null;
    const selectedSpecialty = doctor.specialties.find((specialty) => specialty.id === selectedSpecialtyId) ?? null;
    const description = selectedSpecialty
        ? `${doctor.user.name} · ${selectedSpecialty.name}. Elegí un día marcado.`
        : `${doctor.user.name}. Elegí una especialidad y un día marcado.`;

    const go = (query: { date?: string; specialty_id?: number }) => {
        router.get(`/doctors/${doctor.id}/slots`, query, { preserveState: true });
    };

    const selectDay = (date: string) => {
        setMobileDayOpen(true);
        go({ date, specialty_id: selectedSpecialtyId ?? undefined });
    };

    const changeMonth = (next: string) => {
        setMonth(next);
        if (staffDay) {
            go({ date: next, specialty_id: selectedSpecialtyId ?? undefined });
        }
    };

    const chooseSpecialty = (value: string) => {
        go({
            date: selectedDate ?? undefined,
            specialty_id: value ? Number(value) : undefined,
        });
    };

    const book = (startsAt: string) => {
        if (!selectedSpecialtyId) {
            return;
        }
        if (assigning) {
            if (patientId) {
                router.post(
                    `/admin/doctors/${doctor.id}/appointments`,
                    {
                        starts_at: startsAt,
                        specialty_id: selectedSpecialtyId,
                        patient_id: Number(patientId),
                    },
                    {
                        onSuccess: () => {
                            setBookingOpen(false);
                            setPatientId('');
                        },
                    },
                );
            }
            return;
        }
        router.post(`/doctors/${doctor.id}/appointments`, {
            starts_at: startsAt,
            specialty_id: selectedSpecialtyId,
        });
    };

    const specialtyField = (id: string) => (
        <Field label="Especialidad" htmlFor={id} className="shrink-0">
            <Combobox
                id={id}
                value={selectedSpecialtyId != null ? String(selectedSpecialtyId) : ''}
                placeholder="Elegí una especialidad"
                onChange={chooseSpecialty}
                options={[
                    { value: '', label: 'Elegí una especialidad' },
                    ...doctor.specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name })),
                ]}
            />
        </Field>
    );

    const dayBody = (
        <PanelScroll className="pt-0">
            {!selectedDate ? (
                previewDays.length === 0 ? (
                    <Empty>No hay turnos disponibles.</Empty>
                ) : (
                    previewDays.map((day) => (
                        <ListRow key={day} as="button" onClick={() => selectDay(day)}>
                            {day}
                        </ListRow>
                    ))
                )
            ) : slots.length === 0 ? (
                <Empty>No hay horarios en este día.</Empty>
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
                            disabled={!selectedSpecialtyId || (assigning && !patientId)}
                            onClick={() => book(slot.starts_at)}
                        >
                            <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Reservar
                        </Btn>
                    </SlotRow>
                ))
            )}
        </PanelScroll>
    );

    const staffDayTitle = staffDay ? `Agenda del ${formatDateLabel(staffDay.date)}` : null;

    const staffDayBody = staffDay ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <DayTimeline
                className="mt-[var(--space-xs)] min-h-[12rem] flex-1"
                date={staffDay.date}
                now={staffDay.now}
                stepMinutes={doctor.slot_duration_minutes}
                bands={staffDay.windows.map((window) => ({ key: window.id, starts_at: window.starts_at, ends_at: window.ends_at }))}
                blocks={staffDay.appointments.map((appointment) => ({
                    key: appointment.id,
                    starts_at: appointment.starts_at,
                    ends_at: appointment.ends_at,
                    title: appointment.patient?.name ?? 'Paciente',
                    subtitle: appointment.specialty?.name,
                }))}
                onBlockSelect={(key) => setOpenAppointmentId(Number(key))}
            />
            <div className="flex shrink-0 justify-end pt-[var(--space-sm)]">
                <Btn type="button" onClick={() => setBookingOpen(true)}>
                    <CalendarPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Agendar turno
                </Btn>
            </div>
        </div>
    ) : null;

    const bookingDialog =
        staffDay && bookingOpen ? (
            <ConfirmDialog
                title="Agendar turno"
                message={`${doctor.user.name} · ${formatDateLabel(staffDay.date)}`}
                onDismiss={() => setBookingOpen(false)}
            >
                <div className="flex max-h-[60dvh] min-h-0 flex-col">
                    {specialtyField('slot_specialty_id_modal')}
                    {patients ? (
                        <Field label="Paciente" htmlFor="slot_patient_id" className="shrink-0">
                            <Combobox
                                id="slot_patient_id"
                                value={patientId}
                                placeholder="Elegí un paciente"
                                searchLabel="Buscar por nombre o DNI"
                                onChange={setPatientId}
                                options={[
                                    { value: '', label: 'Elegí un paciente' },
                                    ...patients.map((patient) => ({ value: String(patient.id), label: `${patient.name} · DNI ${patient.dni}` })),
                                ]}
                            />
                        </Field>
                    ) : null}
                    {dayBody}
                </div>
                <div className="flex justify-end">
                    <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={() => setBookingOpen(false)}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                </div>
            </ConfirmDialog>
        ) : null;

    return (
        <>
            <Head title="Turnos disponibles" />
            <PageScreen
                layout="split"
                header={
                    <PageHeader
                        title="Turnos disponibles"
                        description={description}
                        backHref={`/doctors/${doctor.id}`}
                        backLabel={doctor.user.name}
                    />
                }
            >
                <StageCard id="slots-body">
                    <MobileDaySwap
                        dayOpen={mobileDayOpen}
                        onBackToCalendar={() => {
                            setMobileDayOpen(false);
                            if (!staffDay) {
                                go({ specialty_id: selectedSpecialtyId ?? undefined });
                            }
                        }}
                        calendar={
                            <div className="flex h-full min-h-0 flex-col gap-[var(--space-xs)]">
                                {staffDay ? null : specialtyField('slot_specialty_id_mobile_cal')}
                                <div className="flex min-h-0 flex-1 items-center justify-center">
                                    <CalendarMonth
                                        month={month}
                                        selected={selectedDate}
                                        tones={tones}
                                        onSelect={selectDay}
                                        onMonthChange={changeMonth}
                                        legend={legend}
                                    />
                                </div>
                            </div>
                        }
                        panel={
                            staffDay ? (
                                <Panel title={staffDayTitle} className="h-full min-h-0 gap-0">
                                    {staffDayBody}
                                </Panel>
                            ) : (
                                <Panel title={selectedDate ?? 'Próximos días con turnos'} className="h-full min-h-0 gap-0">
                                    {specialtyField('slot_specialty_id_mobile_day')}
                                    {dayBody}
                                </Panel>
                            )
                        }
                    />

                    <StageCard layout="split" className="max-md:!hidden">
                        <CalendarMonth
                            month={month}
                            selected={selectedDate}
                            tones={tones}
                            onSelect={selectDay}
                            onMonthChange={changeMonth}
                            legend={legend}
                        />
                        {staffDay ? (
                            <Panel title={staffDayTitle} className="gap-0">
                                {staffDayBody}
                            </Panel>
                        ) : (
                            <Panel sheet title={!selectedDate ? 'Próximos días con turnos' : selectedDate}>
                                {specialtyField('slot_specialty_id')}
                                {dayBody}
                            </Panel>
                        )}
                    </StageCard>
                </StageCard>
            </PageScreen>
            {bookingDialog}
            {openAppointment ? (
                <TimelineAppointmentDialog
                    appointment={openAppointment}
                    profileHref={canViewPatient ? `/admin/patients/${openAppointment.patient_id}` : null}
                    canCancel={canCancel}
                    onDismiss={() => setOpenAppointmentId(null)}
                />
            ) : null}
        </>
    );
}
