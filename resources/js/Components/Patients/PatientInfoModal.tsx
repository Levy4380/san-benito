import { ConfirmDialog, DialogActions } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import PatientProfileFields from '@/Components/Patients/PatientProfileFields';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import { getJson } from '@/lib/json';
import type { HealthInsurance, PatientRecord } from '@/types';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

/** `GET /patients/{patient}`: staff (`patients.catalog.view`) también recibe el catálogo de obras sociales para editarla. */
type ProfilePayload = {
    patient: PatientRecord;
    healthInsuranceId?: number | null;
    healthInsurances?: HealthInsurance[];
};

type EditableProfile = Required<ProfilePayload>;

type Props = {
    patientId: number;
    onDismiss: () => void;
    onOpenAgenda?: () => void;
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
        <ConfirmDialog title={patient?.name ?? 'Paciente'} message="Datos del paciente." onDismiss={onDismiss} kind="info">
            {failed ? (
                <Empty>No se pudo cargar la ficha.</Empty>
            ) : loading || !patient || !profile ? (
                <Hint>Cargando…</Hint>
            ) : isEditable(profile) ? (
                <>
                    <PatientProfileFields patient={patient} showHealthInsurance={false} className="max-h-[min(40dvh,22rem)] overflow-y-auto" />
                    <PatientInsuranceForm profile={profile} onDismiss={onDismiss} onOpenAgenda={onOpenAgenda} />
                </>
            ) : (
                <PatientProfileFields patient={patient} className="max-h-[min(40dvh,22rem)] overflow-y-auto" />
            )}
            {onOpenAgenda && !failed && profile && !isEditable(profile) ? (
                <DialogActions>
                    <AgendaBtn onClick={onOpenAgenda} />
                </DialogActions>
            ) : null}
        </ConfirmDialog>
    );
}

function isEditable(profile: ProfilePayload): profile is EditableProfile {
    return profile.healthInsurances !== undefined;
}

function AgendaBtn({ onClick }: { onClick?: () => void }) {
    return onClick ? (
        <Btn type="button" onClick={onClick}>
            Ver agenda
        </Btn>
    ) : null;
}

function PatientInsuranceForm({
    profile,
    onDismiss,
    onOpenAgenda,
}: {
    profile: EditableProfile;
    onDismiss: () => void;
    onOpenAgenda?: () => void;
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
            <DialogActions>
                <Btn type="submit" disabled={form.processing}>
                    <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Guardar
                </Btn>
                <AgendaBtn onClick={onOpenAgenda} />
            </DialogActions>
        </form>
    );
}
