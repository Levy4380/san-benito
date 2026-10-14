import CreateProfessionalModal from '@/Components/Admin/CreateProfessionalModal';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog from '@/Components/Surfaces/Catalog';
import type { FilterValues } from '@/Components/Surfaces/Filters';
import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord, Specialty } from '@/types';
import { Head, router } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

type Props = {
    professionals: ProfessionalRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function AdminProfessionals({ professionals, specialties, filters }: Props) {
    const [creating, setCreating] = useState(false);
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const apply = (data: FilterValues) => {
        router.get('/admin/profesionales', data, { preserveState: true });
    };

    return (
        <>
            <Head title="Profesionales" />
            <PageScreen
                header={
                    <PageHeader
                        title="Profesionales"
                        description="Alta de profesionales."
                        actions={
                            <Btn type="button" onClick={() => setCreating(true)}>
                                <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Crear profesional
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Catalog
                        applied={{ specialty_id: filters.specialty_id || 'all' }}
                        onApply={apply}
                        empty={hasFilters ? 'No hay profesionales con esos filtros.' : 'Todavía no hay profesionales.'}
                        items={professionals.map((professional) => ({
                            key: professional.id,
                            title: professional.user.name,
                            lines: [specialtyNames(professional.specialties), professional.license_number],
                            actions: [
                                { kind: 'info', href: `/admin/profesionales/${professional.id}`, name: professional.user.name },
                                { kind: 'agenda', href: `/admin/profesionales/${professional.id}/horarios`, name: professional.user.name },
                            ],
                        }))}
                        primary={
                            <Field label="Buscar" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} placeholder="Nombre" />
                            </Field>
                        }
                        advanced={
                            <Field label="Especialidad" htmlFor="filter_specialty_id" flush className="min-w-0">
                                <Combobox
                                    id="filter_specialty_id"
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
            {creating ? <CreateProfessionalModal onDismiss={() => setCreating(false)} /> : null}
        </>
    );
}
