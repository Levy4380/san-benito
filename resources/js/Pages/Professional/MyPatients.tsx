import AssignModal from '@/Components/Agenda/AssignModal';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog, { type CatalogAction } from '@/Components/Surfaces/Catalog';
import type { FilterValues } from '@/Components/Surfaces/Filters';
import type { HealthInsurance, PatientRecord, Specialty } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
    patients: PatientRecord[];
    candidates: PatientRecord[];
    healthInsurances: HealthInsurance[];
    specialties: Specialty[];
    filters: { q: string; health_insurance_id: string; specialty_id: string };
};

function patientLines(patient: PatientRecord): string[] {
    return [`DNI ${patient.dni}`, patient.health_insurance ?? 'Particular'];
}

export default function MyPatients({ patients, candidates, healthInsurances, specialties, filters }: Props) {
    const [assigning, setAssigning] = useState<PatientRecord | null>(null);
    const hasFilters =
        filters.q.trim() !== '' ||
        (filters.health_insurance_id !== '' && filters.health_insurance_id !== 'all') ||
        (filters.specialty_id !== '' && filters.specialty_id !== 'all');
    const linkedIds = new Set(patients.map((patient) => patient.id));
    const toLink = candidates.filter((patient) => !linkedIds.has(patient.id));

    const apply = (data: FilterValues) => {
        router.get('/profesional/mis-pacientes', data, { preserveState: true });
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
                { kind: 'info' as const, href: `/profesional/mis-pacientes/${patient.id}`, name: patient.name },
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
                        applied={{
                            health_insurance_id: filters.health_insurance_id || 'all',
                            specialty_id: filters.specialty_id || 'all',
                        }}
                        onApply={apply}
                        empty={hasFilters ? 'No hay pacientes con esos filtros.' : 'Todavía no tenés pacientes vinculados.'}
                        items={items}
                        primary={
                            <Field label="Buscar" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} placeholder="Nombre, DNI o correo" />
                            </Field>
                        }
                        advanced={
                            <>
                                <Field label="Obra social" htmlFor="filter_health_insurance_id" flush className="min-w-0">
                                    <Combobox
                                        id="filter_health_insurance_id"
                                        name="health_insurance_id"
                                        defaultValue={filters.health_insurance_id || 'all'}
                                        options={[
                                            { value: 'all', label: 'Todas' },
                                            ...healthInsurances.map((healthInsurance) => ({
                                                value: String(healthInsurance.id),
                                                label: healthInsurance.name,
                                            })),
                                        ]}
                                    />
                                </Field>
                                <Field label="Especialidad" htmlFor="filter_specialty_id" flush className="min-w-0">
                                    <Combobox
                                        id="filter_specialty_id"
                                        name="specialty_id"
                                        defaultValue={filters.specialty_id || 'all'}
                                        options={[
                                            { value: 'all', label: 'Todas' },
                                            ...specialties.map((specialty) => ({
                                                value: String(specialty.id),
                                                label: specialty.name,
                                            })),
                                        ]}
                                    />
                                </Field>
                            </>
                        }
                    />
                </StageCard>
            </PageScreen>
            {assigning ? <AssignModal patient={assigning} onDismiss={() => setAssigning(null)} /> : null}
        </>
    );
}
