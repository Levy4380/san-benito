import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog from '@/Components/Surfaces/Catalog';
import type { FilterValues } from '@/Components/Surfaces/Filters';
import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord, Specialty } from '@/types';
import { Head, router } from '@inertiajs/react';

type Props = {
    professionals: ProfessionalRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function ProfessionalsIndex({ professionals, specialties, filters }: Props) {
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const apply = (data: FilterValues) => {
        router.get('/paciente/profesionales', data, { preserveState: true });
    };

    return (
        <>
            <Head title="Profesionales" />
            <PageScreen header={<PageHeader title="Profesionales" description="Buscá por especialidad o nombre." />}>
                <StageCard>
                    <Catalog
                        applied={{ specialty_id: filters.specialty_id || 'all' }}
                        onApply={apply}
                        empty={hasFilters ? 'No hay profesionales con esos filtros.' : 'Todavía no hay profesionales.'}
                        items={professionals.map((professional) => ({
                            key: professional.id,
                            title: professional.user.name,
                            lines: [specialtyNames(professional.specialties)],
                            actions: [
                                { kind: 'info', href: `/paciente/profesionales/${professional.id}`, name: professional.user.name },
                                { kind: 'slots', href: `/paciente/profesionales/${professional.id}/horarios` },
                            ],
                        }))}
                        primary={
                            <Field label="Buscar" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} placeholder="Nombre" />
                            </Field>
                        }
                        advanced={
                            <Field label="Especialidad" htmlFor="specialty_id" flush className="min-w-0">
                                <Combobox
                                    id="specialty_id"
                                    name="specialty_id"
                                    defaultValue={filters.specialty_id || 'all'}
                                    options={[
                                        { value: 'all', label: 'Todas' },
                                        ...specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name })),
                                    ]}
                                />
                            </Field>
                        }
                    />
                </StageCard>
            </PageScreen>
        </>
    );
}
