import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog, { type CatalogAction } from '@/Components/Surfaces/Catalog';
import type { PatientRecord } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Props = {
    patients: PatientRecord[];
    candidates: PatientRecord[];
    filters: { q: string };
};

function patientLines(patient: PatientRecord): string[] {
    return [`DNI ${patient.dni}`, patient.health_insurance ?? 'Sin obra social'];
}

export default function MyPatients({ patients, candidates, filters }: Props) {
    const hasSearch = filters.q.trim() !== '';
    const linkedIds = new Set(patients.map((patient) => patient.id));
    const toLink = candidates.filter((patient) => !linkedIds.has(patient.id));

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/my-patients', Object.fromEntries(data), { preserveState: true });
    };

    const items = [
        ...toLink.map((patient) => ({
            key: `link-${patient.id}`,
            title: patient.user.name,
            lines: patientLines(patient),
            actions: [{ kind: 'link' as const, onClick: () => router.post('/my-patients', { patient_id: patient.id }) }] satisfies CatalogAction[],
        })),
        ...patients.map((patient) => ({
            key: patient.id,
            title: patient.user.name,
            lines: patientLines(patient),
            actions: [
                { kind: 'info' as const, href: `/my-patients/${patient.id}`, name: patient.user.name },
                { kind: 'assign' as const, href: `/agenda?patient_id=${patient.id}&panel=assign` },
            ] satisfies CatalogAction[],
        })),
    ];

    return (
        <>
            <Head title="Mis pacientes" />
            <PageScreen header={<PageHeader title="Mis pacientes" description="Pacientes vinculados a tu agenda." />}>
                <StageCard>
                    <Catalog
                        filterVariant="one"
                        onSearch={submit}
                        empty={hasSearch ? 'No hay pacientes con esos filtros.' : 'Todavía no tenés pacientes vinculados.'}
                        items={items}
                    >
                        <Field label="Nombre, DNI o correo" htmlFor="q" flush className="min-w-0">
                            <TextInput id="q" name="q" defaultValue={filters.q} />
                        </Field>
                    </Catalog>
                </StageCard>
            </PageScreen>
        </>
    );
}
