import PatientProfileBtn from '@/Components/Common/PatientProfileBtn';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import { formatDateLabel, wallDate, wallTime } from '@/lib/datetime';
import type { AppointmentRecord } from '@/types';
import { router } from '@inertiajs/react';
import { Undo2, X } from 'lucide-react';
import { useState } from 'react';

type Props = {
    appointment: AppointmentRecord;
    /** Patient profile URL; omit to hide «Ver paciente» */
    profileHref?: string | null;
    canCancel: boolean;
    onDismiss: () => void;
};

export default function TimelineAppointmentDialog({ appointment, profileHref, canCancel, onDismiss }: Props) {
    const [cancelling, setCancelling] = useState(false);
    const patientName = appointment.patient?.name ?? 'Paciente';

    const cancel = () => {
        router.delete(`/appointments/${appointment.id}`, {
            preserveScroll: true,
            onStart: () => setCancelling(true),
            onFinish: () => setCancelling(false),
            onSuccess: onDismiss,
        });
    };

    return (
        <ConfirmDialog
            title={patientName}
            message={
                <>
                    <span className="font-mono">
                        {wallTime(appointment.starts_at)}–{wallTime(appointment.ends_at)}
                    </span>{' '}
                    · {formatDateLabel(wallDate(appointment.starts_at))}
                    {appointment.specialty?.name ? ` · ${appointment.specialty.name}` : ''}
                </>
            }
            onDismiss={onDismiss}
        >
            <div className="flex flex-wrap justify-end gap-[0.5rem]">
                <Btn type="button" variant="outline" onClick={onDismiss}>
                    <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Volver
                </Btn>
                {profileHref ? (
                    <PatientProfileBtn patientId={appointment.patient_id} name={patientName} href={profileHref} label="Ver paciente" />
                ) : null}
                {canCancel ? (
                    <Btn type="button" variant="danger" onClick={cancel} disabled={cancelling}>
                        <X className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Cancelar turno
                    </Btn>
                ) : null}
            </div>
        </ConfirmDialog>
    );
}
