import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import DoctorCard, { DoctorCardActions, DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, Specialty } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, Info, Search } from 'lucide-react';
import { FormEventHandler } from 'react';

type Props = {
    doctors: DoctorRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function DoctorsIndex({ doctors, specialties, filters }: Props) {
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/doctors', Object.fromEntries(form), { preserveState: true });
    };

    return (
        <>
            <Head title="Doctores" />
            <PageScreen header={<PageHeader title="Doctores" description="Buscá por especialidad o nombre." />}>
                <StageCard>
                    <Results>
                        <Filters onSubmit={submit}>
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
                            <Field label="Nombre" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} />
                            </Field>
                            <Btn type="submit" className="self-end">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar
                            </Btn>
                        </Filters>
                        {doctors.length === 0 ? (
                            <Empty>{hasFilters ? 'No hay profesionales con esos filtros.' : 'Todavía no hay profesionales.'}</Empty>
                        ) : (
                            <DoctorGrid>
                                {doctors.map((doctor) => (
                                    <DoctorCard key={doctor.id} as="div">
                                        <strong>{doctor.user.name}</strong>
                                        <span>{specialtyNames(doctor.specialties)}</span>
                                        <DoctorCardActions>
                                            <Btn size="sm" variant="outline" asChild>
                                                <Link href={`/doctors/${doctor.id}`}>
                                                    <Info className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Más información
                                                </Link>
                                            </Btn>
                                            <Btn size="sm" asChild>
                                                <Link href={`/doctors/${doctor.id}/slots`}>
                                                    <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Ver turnos
                                                </Link>
                                            </Btn>
                                        </DoctorCardActions>
                                    </DoctorCard>
                                ))}
                            </DoctorGrid>
                        )}
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
