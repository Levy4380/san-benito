import PatientProfileBtn from '@/Components/Common/PatientProfileBtn';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import { formatDateLabel, wallDate, wallTime } from '@/lib/datetime';
import { canSeeAppointmentPatient, canSeeAppointmentProfessional } from '@/lib/roles';
import type { AppointmentRecord, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Undo2, X } from 'lucide-react';

type Props = {
    appointment: AppointmentRecord;
    onDismiss: () => void;
    /** Patient profile URL; omit to hide «Ver paciente» */
    profileHref?: string | null;
    canCancel?: boolean;
    onCancel?: () => void;
};

export default function AppointmentDetailDialog({
    appointment,
    onDismiss,
    profileHref,
    canCancel = false,
    onCancel,
}: Props) {
    const roles = usePage<SharedData>().props.auth.user?.roles ?? [];
    const showProfessional = canSeeAppointmentProfessional(roles);
    const showPatient = canSeeAppointmentPatient(roles);
    const patient = appointment.patient;
    const professional = appointment.professional;
    const patientName = patient?.name ?? 'Paciente';

    return (
        <ConfirmDialog title="Detalle del turno" onDismiss={onDismiss} kind="info">
            <div className="grid gap-[var(--space-sm)] text-sm">
                <DetailBlock
                    title="Turno"
                    rows={[
                        ['Fecha', formatDateLabel(wallDate(appointment.starts_at))],
                        ['Horario', `${wallTime(appointment.starts_at)} — ${wallTime(appointment.ends_at)}`],
                        ['Especialidad', appointment.specialty?.name ?? '—'],
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
                            ['Nombre', professional?.user.name ?? ''],
                            [
                                'Especialidades',
                                professional?.specialties.map((specialty) => specialty.name).join(', ') || '—',
                            ],
                        ]}
                    />
                ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-[var(--space-sm)]">
                <Btn type="button" variant="outline" onClick={onDismiss}>
                    <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Volver
                </Btn>
                {profileHref && showPatient ? (
                    <PatientProfileBtn
                        patientId={appointment.patient_id}
                        name={patientName}
                        href={profileHref}
                        label="Ver paciente"
                    />
                ) : null}
                {canCancel && onCancel ? (
                    <Btn type="button" variant="danger" onClick={onCancel}>
                        <X className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Cancelar turno
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
