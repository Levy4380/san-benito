import {
    AppointmentAttendanceControls,
    AppointmentStatusBadge,
    ClearAttendanceBtn,
    useAppointmentAttendance,
    useCanMarkAttendance,
} from '@/Components/Appointments/AppointmentStatus';
import RescheduleAppointmentModal from '@/Components/Appointments/RescheduleAppointmentModal';
import { DetailBlock, DetailBlocks } from '@/Components/Common/DetailList';
import { ConfirmDialog, DialogActions, useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import PatientInfoModal from '@/Components/Patients/PatientInfoModal';
import { appointmentStarted } from '@/lib/appointment-status';
import { formatDateLabel, wallDate, wallTime } from '@/lib/datetime';
import { hasPermission, Permission } from '@/lib/permissions';
import { canSeeAppointmentPatient, canSeeAppointmentProfessional } from '@/lib/roles';
import type { AppointmentRecord, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { CalendarClock, Info, X } from 'lucide-react';
import { useState } from 'react';

type Props = {
    appointment: AppointmentRecord;
    onDismiss: () => void;
    /** After cancel / attendance succeeds: JSON-fed screens (agenda modals) refetch here. */
    onChanged?: () => void;
};

/**
 * The one «Detalle del turno» modal (lists, homes, buscador, timelines, agenda modals).
 * What it shows and which actions it offers depend only on who is looking, never on the screen:
 * - Paciente / Profesional blocks: by role (`canSeeAppointmentPatient` / `canSeeAppointmentProfessional`).
 * - Atendido / Ausente: `appointments.attendance` or `own.appointments.attendance`, once started.
 * - Ver paciente: opens `PatientInfoModal` (`GET /patients/{patient}`) with `patients.catalog.view` or `own.patients.view`.
 * - Reprogramar: `appointments.reschedule` (staff, + sobreturno) or `own.appointments.reschedule` (professional), before it starts (d51).
 * - Cancelar turno: `appointments.cancel` or `own.appointments.cancel`, before it starts, with confirmation (d29).
 */
export default function AppointmentDetailDialog({ appointment, onDismiss, onChanged }: Props) {
    const user = usePage<SharedData>().props.auth.user;
    const roles = user?.roles ?? [];
    const permissions = user?.permissions;
    const showProfessional = canSeeAppointmentProfessional(roles);
    const showPatient = canSeeAppointmentPatient(roles);
    const patient = appointment.patient;
    const professional = appointment.professional;
    const canMarkAttendance = useCanMarkAttendance();
    const { attendance, status, saving, mark } = useAppointmentAttendance(appointment, onChanged);
    const { ask, dialog } = useConfirm();
    const [cancelling, setCancelling] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [viewingPatient, setViewingPatient] = useState(false);

    const canViewPatient =
        showPatient &&
        (hasPermission(permissions, Permission.PatientsCatalogView) || hasPermission(permissions, Permission.OwnPatientsView));
    const canCancel =
        !appointmentStarted(appointment.starts_at) &&
        (hasPermission(permissions, Permission.AppointmentsCancel) || hasPermission(permissions, Permission.OwnAppointmentsCancel));

    const canReschedule =
        !appointmentStarted(appointment.starts_at) &&
        (hasPermission(permissions, Permission.AppointmentsReschedule) ||
            hasPermission(permissions, Permission.OwnAppointmentsReschedule));

    const started = appointmentStarted(appointment.starts_at);
    const hasActions = canViewPatient || (canMarkAttendance && started) || canReschedule || canCancel;

    const cancel = async () => {
        const ok = await ask({
            title: 'Cancelar turno',
            message: '¿Cancelar este turno? El horario volverá a estar disponible.',
            confirmLabel: 'Cancelar turno',
            danger: true,
        });
        if (!ok) {
            return;
        }

        router.delete(`/appointments/${appointment.id}`, {
            preserveScroll: true,
            onStart: () => setCancelling(true),
            onFinish: () => setCancelling(false),
            onSuccess: () => {
                onChanged?.();
                onDismiss();
            },
        });
    };

    return (
        <>
            <ConfirmDialog title="Detalle del turno" onDismiss={onDismiss} kind="info">
                <DetailBlocks>
                    <DetailBlock
                        title="Turno"
                        rows={[
                            ['Fecha', formatDateLabel(wallDate(appointment.starts_at))],
                            ['Horario', <span key="time" className="font-mono">{`${wallTime(appointment.starts_at)} — ${wallTime(appointment.ends_at)}`}</span>],
                            ['Especialidad', appointment.specialty?.name ?? '—'],
                            [
                                'Estado',
                                <span key="status" className="inline-flex flex-wrap items-center gap-[0.4rem]">
                                    <AppointmentStatusBadge status={status} />
                                    {canMarkAttendance && started ? (
                                        <ClearAttendanceBtn attendance={attendance} saving={saving} onMark={mark} />
                                    ) : null}
                                </span>,
                            ],
                        ]}
                    />
                    {showPatient ? (
                        <DetailBlock
                            title="Paciente"
                            rows={[
                                ['Nombre', patient?.name ?? ''],
                                ['DNI', patient?.dni ?? ''],
                                ['Correo', patient?.email ?? ''],
                                ['Obra social', patient?.health_insurance ?? 'Particular'],
                            ]}
                        />
                    ) : null}
                    {showProfessional ? (
                        <DetailBlock
                            title="Profesional"
                            rows={[
                                ['Nombre', professional?.user?.name ?? ''],
                                ['Especialidades', professional?.specialties?.map((specialty) => specialty.name).join(', ') || '—'],
                            ]}
                        />
                    ) : null}
                </DetailBlocks>
                {hasActions ? (
                    <DialogActions>
                        {canViewPatient ? (
                            <Btn type="button" variant="outline" onClick={() => setViewingPatient(true)}>
                                <Info className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Ver paciente
                            </Btn>
                        ) : null}
                        {canMarkAttendance ? (
                            <AppointmentAttendanceControls appointment={appointment} attendance={attendance} saving={saving} onMark={mark} />
                        ) : null}
                        {canReschedule ? (
                            <Btn type="button" variant="outline" onClick={() => setRescheduling(true)}>
                                <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Reprogramar
                            </Btn>
                        ) : null}
                        {canCancel ? (
                            <Btn type="button" variant="danger" onClick={cancel} disabled={cancelling}>
                                <X className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Cancelar turno
                            </Btn>
                        ) : null}
                    </DialogActions>
                ) : null}
            </ConfirmDialog>
            {rescheduling ? (
                <RescheduleAppointmentModal
                    appointment={appointment}
                    onDismiss={() => setRescheduling(false)}
                    onRescheduled={() => {
                        onChanged?.();
                        onDismiss();
                    }}
                />
            ) : null}
            {viewingPatient ? <PatientInfoModal patientId={appointment.patient_id} onDismiss={() => setViewingPatient(false)} /> : null}
            {dialog}
        </>
    );
}
