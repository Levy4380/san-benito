import AssignModal from '@/Components/Agenda/AssignModal';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog, { type CatalogAction } from '@/Components/Surfaces/Catalog';
import type { FilterValues } from '@/Components/Surfaces/Filters';
import type { PatientRecord } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
    patients: PatientRecord[];
    candidates: PatientRecord[];
    filters: { q: string };
};

function patientLines(patient: PatientRecord): string[] {
    return [`DNI ${patient.dni}`, patient.health_insurance ?? 'Sin obra social'];
}

export default function MyPatients({ patients, candidates, filters }: Props) {
    const [assigning, setAssigning] = useState<PatientRecord | null>(null);
    const hasSearch = filters.q.trim() !== '';
    const linkedIds = new Set(patients.map((patient) => patient.id));
    const toLink = candidates.filter((patient) => !linkedIds.has(patient.id));

    const apply = (data: FilterValues) => {
        router.get('/my-patients', data, { preserveState: true });
    };

    const items = [
        ...toLink.map((patient) => ({
            key: `link-${patient.id}`,
            title: patient.name,
            lines: patientLines(patient),
            actions: [{ kind: 'link' as const, onClick: () => router.post('/my-patients', { patient_id: patient.id }) }] satisfies CatalogAction[],
        })),
        ...patients.map((patient) => ({
            key: patient.id,
            title: patient.name,
            lines: patientLines(patient),
            actions: [
                { kind: 'info' as const, href: `/my-patients/${patient.id}`, name: patient.name },
                { kind: 'assign' as const, onClick: () => setAssigning(patient) },
            ] satisfies CatalogAction[],
        })),
    ];

    return (
        <>
            <Head title="Mis pacientes" />
            <PageScreen header={<PageHeader title="Mis pacientes" description="Pacientes vinculados a tu agenda." />}>
                <StageCard>
                    <Catalog
                        onApply={apply}
                        empty={hasSearch ? 'No hay pacientes con esos filtros.' : 'Todavía no tenés pacientes vinculados.'}
                        items={items}
                        primary={
                            <Field label="Nombre, DNI o correo" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} />
                            </Field>
                        }
                    />
                </StageCard>
            </PageScreen>
            {assigning ? <AssignModal patient={assigning} onDismiss={() => setAssigning(null)} /> : null}
        </>
    );
}
