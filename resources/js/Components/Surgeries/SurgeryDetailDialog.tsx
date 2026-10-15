import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import { hasPermission, Permission } from '@/lib/permissions';
import { SURGERY_STATUS_LABEL, surgeryRange } from '@/lib/surgery';
import type { SharedData, SurgeryRecord, SurgerySection } from '@/types';
import { router, usePage } from '@inertiajs/react';

type Props = {
    surgery: SurgeryRecord;
    section: SurgerySection;
    onDismiss: () => void;
    onApprove: (surgery: SurgeryRecord) => void;
};

export function SurgeryStatusBadge({ status }: { status: SurgeryRecord['status'] }) {
    return (
        <span
            className="mt-[0.3rem] inline-flex w-fit items-center gap-[0.35rem] rounded-md px-[0.5rem] py-[0.15rem] text-[length:var(--text-xs)] leading-[1.3] font-medium whitespace-nowrap before:size-[0.45rem] before:rounded-full before:bg-current before:content-['']"
            data-status={status}
            style={badgeStyle(status)}
        >
            {SURGERY_STATUS_LABEL[status]}
        </span>
    );
}

export default function SurgeryDetailDialog({ surgery, section, onDismiss, onApprove }: Props) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions;
    const patient = surgery.patient;
    const professional = surgery.professional;
    const schedule =
        surgery.starts_at && surgery.ends_at
            ? `${surgery.starts_at.slice(0, 10)} · ${surgeryRange(surgery.starts_at, surgery.ends_at)}`
            : 'Sin horario';

    return (
        <ConfirmDialog
            title="Detalle de la cirugía"
            onDismiss={onDismiss}
            className="w-[min(40rem,100%)]"
        >
            <div className="flex items-center justify-between gap-[var(--space-sm)]">
                <SurgeryStatusBadge status={surgery.status} />
            </div>
            <div className="grid gap-[var(--space-sm)] text-sm">
                <DetailBlock
                    title="Cirugía"
                    rows={[
                        ['Estado', SURGERY_STATUS_LABEL[surgery.status]],
                        ['Horario', schedule],
                        ['Obra social', surgery.health_insurance?.name ?? 'Particular'],
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
                <DetailBlock
                    title="Profesional"
                    rows={[
                        ['Nombre', professional?.user.name ?? ''],
                        ['Especialidades', professional?.specialties.map((specialty) => specialty.name).join(', ') || '—'],
                    ]}
                />
                <section className="grid gap-[0.25rem]">
                    <h3 className="m-0 text-sm font-semibold text-ink">Nota</h3>
                    <p className="m-0 whitespace-pre-wrap text-ink-2">{surgery.note}</p>
                </section>
            </div>
            <div className="flex flex-wrap justify-end gap-[var(--space-sm)]">
                <Btn type="button" variant="outline" onClick={onDismiss}>
                    Cerrar
                </Btn>
                {hasPermission(permissions, Permission.SurgeriesRequest) && surgery.status === 'pending' ? (
                    <Btn type="button" onClick={() => router.post(`/admin/cirugias/${surgery.id}/solicitar`)}>
                        Marcar como solicitada
                    </Btn>
                ) : null}
                {hasPermission(permissions, Permission.SurgeriesApprove) && surgery.status === 'requested' ? (
                    <Btn type="button" onClick={() => onApprove(surgery)}>
                        Aprobar
                    </Btn>
                ) : null}
                {hasPermission(permissions, Permission.SurgeriesSchedule) && surgery.status === 'to_schedule' ? (
                    <Btn type="button" onClick={() => router.visit(`/admin/cirugias/${surgery.id}/programar?from=${section}`)}>
                        Programar
                    </Btn>
                ) : null}
            </div>
        </ConfirmDialog>
    );
}

function DetailBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
    return (
        <section className="grid gap-[0.25rem]">
            <h3 className="m-0 text-sm font-semibold text-ink">{title}</h3>
            <dl className="m-0 grid gap-[0.2rem]">
                {rows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-[var(--space-sm)]">
                        <dt className="text-ink-2">{label}</dt>
                        <dd className="m-0 text-ink">{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function badgeStyle(status: SurgeryRecord['status']): { background: string; color: string } {
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
