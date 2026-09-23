import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import Surface from '@/Components/Surfaces/Surface';
import type { HealthInsurance, PatientRecord } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

type Props = {
    patient: PatientRecord;
    healthInsuranceId: number | null;
    healthInsurances: HealthInsurance[];
};

export default function AdminUserPatient({ patient, healthInsuranceId, healthInsurances }: Props) {
    const form = useForm({
        health_insurance_id: healthInsuranceId ? String(healthInsuranceId) : '',
    });

    return (
        <>
            <Head title={patient.user.name} />
            <PageScreen header={<PageHeader title={patient.user.name} backHref="/admin/patients" backLabel="Pacientes" />}>
                <StageCard>
                    <Surface className="min-h-0 flex-1 gap-[var(--space-md)] overflow-y-auto">
                        <dl className="m-0 grid w-full gap-[var(--space-sm)]">
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Nombre</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.user.name}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">DNI</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.dni}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Fecha de nacimiento</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.birth_date}</dd>
                            </div>
                            <div className="grid gap-[0.2rem]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Teléfono</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.user.phone ?? '—'}</dd>
                            </div>
                        </dl>
                        <form
                            className="grid content-start gap-[var(--space-sm)]"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.patch(`/admin/patients/${patient.id}/health-insurance`);
                            }}
                        >
                            <Field label="Obra social (opcional)" htmlFor="health_insurance_id" error={form.errors.health_insurance_id}>
                                <NativeSelect
                                    id="health_insurance_id"
                                    value={form.data.health_insurance_id}
                                    onChange={(event) => form.setData('health_insurance_id', event.target.value)}
                                >
                                    <option value="">Sin obra social</option>
                                    {healthInsurances.map((healthInsurance) => (
                                        <option key={healthInsurance.id} value={healthInsurance.id}>
                                            {healthInsurance.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Btn type="submit" disabled={form.processing}>
                                <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Guardar
                            </Btn>
                        </form>
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
