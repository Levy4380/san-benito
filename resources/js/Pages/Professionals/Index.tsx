import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import { ConfirmDialog, DialogActions } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import TextInput from '@/Components/Form/TextInput';
import ProfessionalProfileFields from '@/Components/Professionals/ProfessionalProfileFields';
import Catalog from '@/Components/Surfaces/Catalog';
import type { FilterValues } from '@/Components/Surfaces/Filters';
import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord, Specialty } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';

type Props = {
    professionals: ProfessionalRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function ProfessionalsIndex({ professionals, specialties, filters }: Props) {
    const [info, setInfo] = useState<ProfessionalRecord | null>(null);
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
                                { kind: 'info', name: professional.user.name, onClick: () => setInfo(professional) },
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
            {info ? (
                <ConfirmDialog title={info.user.name} message="Datos del profesional." onDismiss={() => setInfo(null)} kind="info">
                    <ProfessionalProfileFields professional={info} />
                    <DialogActions>
                        <Btn asChild>
                            <Link href={`/paciente/profesionales/${info.id}/horarios`}>
                                <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Ver turnos
                            </Link>
                        </Btn>
                    </DialogActions>
                </ConfirmDialog>
            ) : null}
        </>
    );
}
