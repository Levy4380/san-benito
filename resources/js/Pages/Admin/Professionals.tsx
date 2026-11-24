import CreateProfessionalModal from '@/Components/Admin/CreateProfessionalModal';
import ProfessionalAgendaModal from '@/Components/Admin/ProfessionalAgendaModal';
import ProfessionalInfoModal from '@/Components/Admin/ProfessionalInfoModal';
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
import { Head, router, usePage } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

type Props = {
    professionals: ProfessionalRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

function queryId(key: string, url: string): number | null {
    const value = new URLSearchParams(url.split('?')[1] ?? '').get(key);
    if (!value || !/^\d+$/.test(value)) {
        return null;
    }

    return Number(value);
}

export default function AdminProfessionals({ professionals, specialties, filters }: Props) {
    const page = usePage();
    const [creating, setCreating] = useState(false);
    const [infoId, setInfoId] = useState<number | null>(() => queryId('info', page.url));
    const [agendaId, setAgendaId] = useState<number | null>(() => queryId('agenda', page.url));
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const info = professionals.find((professional) => professional.id === infoId) ?? null;
    const agenda = professionals.find((professional) => professional.id === agendaId) ?? null;

    const catalogQuery = () => {
        const data: FilterValues = {};
        if (filters.q.trim() !== '') {
            data.q = filters.q;
        }
        if (filters.specialty_id !== '' && filters.specialty_id !== 'all') {
            data.specialty_id = filters.specialty_id;
        }
        return data;
    };

    const clearModalQuery = () => {
        if (queryId('agenda', page.url) === null && queryId('info', page.url) === null) {
            return;
        }
        router.get('/admin/profesionales', catalogQuery(), { preserveState: true, replace: true });
    };

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
                                { kind: 'info', name: professional.user.name, onClick: () => setInfoId(professional.id) },
                                { kind: 'agenda', name: professional.user.name, onClick: () => setAgendaId(professional.id) },
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
            {info ? (
                <ProfessionalInfoModal
                    professional={info}
                    specialties={specialties}
                    onDismiss={() => {
                        setInfoId(null);
                        clearModalQuery();
                    }}
                    onOpenAgenda={() => {
                        setInfoId(null);
                        setAgendaId(info.id);
                    }}
                />
            ) : null}
            {agenda ? (
                <ProfessionalAgendaModal
                    professionalId={agenda.id}
                    name={agenda.user.name}
                    onDismiss={() => {
                        setAgendaId(null);
                        clearModalQuery();
                    }}
                />
            ) : null}
        </>
    );
}
