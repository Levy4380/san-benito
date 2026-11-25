import { DetailBlock, DetailBlocks, type DetailRow } from '@/Components/Common/DetailList';
import StatusBadge, { type StatusTone } from '@/Components/Common/StatusBadge';
import { ConfirmDialog, DialogActions } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import { appointmentStarted } from '@/lib/appointment-status';
import { formatDateLabel } from '@/lib/datetime';
import { hasPermission, Permission } from '@/lib/permissions';
import { canSeeAppointmentProfessional } from '@/lib/roles';
import { SURGERY_STATUS_LABEL, surgeryRange } from '@/lib/surgery';
import type { SharedData, SurgeryRecord, SurgerySection } from '@/types';
import { router, usePage } from '@inertiajs/react';

type Props = {
    surgery: SurgeryRecord;
    section: SurgerySection;
    onDismiss: () => void;
    onApprove?: (surgery: SurgeryRecord) => void;
    basePath?: string;
    canMarkRequested?: boolean;
    canApprove?: boolean;
    canSchedule?: boolean;
};

export function SurgeryStatusBadge({ status, className }: { status: SurgeryRecord['status']; className?: string }) {
    return (
        <StatusBadge tone={badgeStyle(status)} status={status} className={className}>
            {SURGERY_STATUS_LABEL[status]}
        </StatusBadge>
    );
}

export default function SurgeryDetailDialog({
    surgery,
    section,
    onDismiss,
    onApprove,
    basePath = '/admin/cirugias',
    canMarkRequested,
    canApprove,
    canSchedule,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions;
    const allowMarkRequested = canMarkRequested ?? hasPermission(permissions, Permission.SurgeriesRequest);
    const allowApprove = canApprove ?? hasPermission(permissions, Permission.SurgeriesApprove);
    const allowSchedule = canSchedule ?? hasPermission(permissions, Permission.SurgeriesSchedule);
    const showMarkRequested = allowMarkRequested && surgery.status === 'pending';
    const showApprove = allowApprove && surgery.status === 'requested';
    const showSchedule = allowSchedule && surgery.status === 'to_schedule';
    /** d51: a scheduled surgery that has not started can be moved (same screen and rules as Programar). */
    const showReschedule =
        allowSchedule && surgery.status === 'scheduled' && surgery.starts_at !== null && !appointmentStarted(surgery.starts_at);
    const patient = surgery.patient;
    const professional = surgery.professional;
    const showProfessional = canSeeAppointmentProfessional(auth.user?.roles ?? []);
    const scheduled = surgery.starts_at && surgery.ends_at ? { starts: surgery.starts_at, ends: surgery.ends_at } : null;

    return (
        <ConfirmDialog title="Detalle de la cirugía" onDismiss={onDismiss} kind="info">
            <DetailBlocks>
                <DetailBlock
                    title="Cirugía"
                    rows={[
                        ['Fecha', scheduled ? formatDateLabel(scheduled.starts.slice(0, 10)) : 'Sin horario'],
                        ...(scheduled
                            ? ([['Horario', <span key="time" className="font-mono">{surgeryRange(scheduled.starts, scheduled.ends)}</span>]] as DetailRow[])
                            : []),
                        ['Obra social', surgery.health_insurance?.name ?? 'Particular'],
                        ['Estado', <SurgeryStatusBadge key="status" status={surgery.status} />],
                    ]}
                />
                <DetailBlock
                    title="Paciente"
                    rows={[
                        ['Nombre', patient?.name ?? ''],
                        ['DNI', patient?.dni ?? ''],
                        ['Correo', patient?.email ?? ''],
                    ]}
                />
                {showProfessional ? (
                    <DetailBlock
                        title="Profesional"
                        rows={[
                            ['Nombre', professional?.user?.name ?? ''],
                            ['Especialidades', professional?.specialties?.map((specialty) => specialty.name).join(', ') || '—'],
                        ]}
                    />
                ) : null}
                <DetailBlock title="Nota">
                    <p className="m-0 whitespace-pre-wrap text-ink-2">{surgery.note}</p>
                </DetailBlock>
            </DetailBlocks>
            <DialogActions>
                {showMarkRequested ? (
                    <Btn type="button" onClick={() => router.post(`${basePath}/${surgery.id}/solicitar`, {}, { preserveState: false })}>
                        Marcar como solicitada
                    </Btn>
                ) : null}
                {showApprove && onApprove ? (
                    <Btn type="button" onClick={() => onApprove(surgery)}>
                        Aprobar
                    </Btn>
                ) : null}
                {showSchedule ? (
                    <Btn type="button" onClick={() => router.visit(`${basePath}/${surgery.id}/programar?from=${section}`)}>
                        Programar
                    </Btn>
                ) : null}
                {showReschedule ? (
                    <Btn type="button" onClick={() => router.visit(`${basePath}/${surgery.id}/programar?from=${section}`)}>
                        Reprogramar
                    </Btn>
                ) : null}
            </DialogActions>
        </ConfirmDialog>
    );
}

function badgeStyle(status: SurgeryRecord['status']): StatusTone {
    if (status === 'pending') {
        return { background: 'oklch(88% 0.12 55)', color: 'oklch(35% 0.1 45)' };
    }

    if (status === 'requested') {
        return { background: 'oklch(90% 0.06 200)', color: 'oklch(32% 0.08 210)' };
    }

    if (status === 'to_schedule') {
        return { background: 'oklch(88% 0.06 250)', color: 'oklch(32% 0.08 250)' };
    }

    return { background: 'oklch(90% 0.08 150)', color: 'oklch(36% 0.1 150)' };
}
