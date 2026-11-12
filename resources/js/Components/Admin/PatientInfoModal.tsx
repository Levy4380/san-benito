import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import { getJson } from '@/lib/json';
import type { HealthInsurance, PatientRecord } from '@/types';
import { useForm } from '@inertiajs/react';
import { Save, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type ProfilePayload = {
    patient: PatientRecord;
    healthInsuranceId: number | null;
    healthInsurances: HealthInsurance[];
};

type Props = {
    patientId: number;
    onDismiss: () => void;
    onOpenAgenda: () => void;
};

export default function PatientInfoModal({ patientId, onDismiss, onOpenAgenda }: Props) {
    const [profile, setProfile] = useState<ProfilePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setFailed(false);

        getJson<ProfilePayload>(`/patients/${patientId}`, controller.signal)
            .then((payload) => {
                setProfile(payload);
                setLoading(false);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [patientId]);

    const patient = profile?.patient;

    return (
        <ConfirmDialog title={patient?.name ?? 'Paciente'} message="Datos del paciente." onDismiss={onDismiss} className="w-[min(32rem,100%)]">
            {failed ? (
                <Empty>No se pudo cargar la ficha.</Empty>
            ) : loading || !patient || !profile ? (
                <Hint>Cargando…</Hint>
            ) : (
                <>
                    <dl className="m-0 grid max-h-[min(40dvh,22rem)] w-full gap-[var(--space-sm)] overflow-y-auto">
                        <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Nombre</dt>
                            <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.name}</dd>
                        </div>
                        <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">DNI</dt>
                            <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.dni}</dd>
                        </div>
                        <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Fecha de nacimiento</dt>
                            <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.birth_date}</dd>
                        </div>
                        <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Teléfono</dt>
                            <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.phone ?? '—'}</dd>
                        </div>
                        <div className="grid gap-[0.2rem]">
                            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Correo</dt>
                            <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.email}</dd>
                        </div>
                    </dl>
                    <PatientInsuranceForm profile={profile} onDismiss={onDismiss} onOpenAgenda={onOpenAgenda} />
                </>
            )}
            {failed ? (
                <div className="flex justify-end">
                    <Btn type="button" variant="outline" onClick={onDismiss}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                </div>
            ) : null}
        </ConfirmDialog>
    );
}

function PatientInsuranceForm({
    profile,
    onDismiss,
    onOpenAgenda,
}: {
    profile: ProfilePayload;
    onDismiss: () => void;
    onOpenAgenda: () => void;
}) {
    const form = useForm({
        health_insurance_id: profile.healthInsuranceId ? String(profile.healthInsuranceId) : '',
    });

    return (
        <form
            className="grid content-start gap-[var(--space-sm)]"
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/patients/${profile.patient.id}/health-insurance`, { preserveScroll: true, onSuccess: onDismiss });
            }}
        >
            <Field label="Obra social (opcional)" htmlFor="modal_health_insurance_id" error={form.errors.health_insurance_id}>
                <NativeSelect
                    id="modal_health_insurance_id"
                    value={form.data.health_insurance_id}
                    onChange={(event) => form.setData('health_insurance_id', event.target.value)}
                >
                    <option value="">Particular</option>
                    {profile.healthInsurances.map((healthInsurance) => (
                        <option key={healthInsurance.id} value={healthInsurance.id}>
                            {healthInsurance.name}
                        </option>
                    ))}
                </NativeSelect>
            </Field>
            <div className="flex flex-wrap justify-end gap-[0.55rem]">
                <Btn type="submit" disabled={form.processing}>
                    <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Guardar
                </Btn>
                <Btn type="button" onClick={onOpenAgenda}>
                    Ver agenda
                </Btn>
                <Btn type="button" variant="outline" onClick={onDismiss}>
                    <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Volver
                </Btn>
            </div>
        </form>
    );
}
