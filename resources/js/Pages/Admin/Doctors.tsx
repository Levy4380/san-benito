import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import TextInput from '@/Components/Form/TextInput';
import DoctorCard, { DoctorCardActions, DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, Specialty } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Info, Search, UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Props = {
    doctors: DoctorRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function AdminDoctors({ doctors, specialties, filters }: Props) {
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const submitFilters: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/doctors', Object.fromEntries(data), { preserveState: true });
    };

    return (
        <>
            <Head title="Doctores" />
            <PageScreen
                header={
                    <PageHeader
                        title="Doctores"
                        description="Alta de profesionales."
                        actions={
                            <Btn asChild>
                                <Link href="/admin/doctors/create">
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear doctor
                                </Link>
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Results>
                        <Filters onSubmit={submitFilters}>
                            <Field label="Especialidad" htmlFor="filter_specialty_id" flush className="min-w-0">
                                <NativeSelect
                                    id="filter_specialty_id"
                                    name="specialty_id"
                                    defaultValue={filters.specialty_id || 'all'}
                                >
                                    <option value="all">Todas</option>
                                    {specialties.map((specialty) => (
                                        <option key={specialty.id} value={specialty.id}>
                                            {specialty.name}
                                        </option>
                                    ))}
                                </NativeSelect>
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
                            <Empty>
                                {hasFilters ? 'No hay profesionales con esos filtros.' : 'Todavía no hay profesionales.'}
                            </Empty>
                        ) : (
                            <DoctorGrid>
                                {doctors.map((doctor) => (
                                    <DoctorCard key={doctor.id} as="div">
                                        <strong>{doctor.user.name}</strong>
                                        <span>{specialtyNames(doctor.specialties)}</span>
                                        <span>{doctor.license_number}</span>
                                        <DoctorCardActions>
                                            <Btn size="sm" variant="outline" asChild>
                                                <Link href={`/doctors/${doctor.id}`}>
                                                    <Info className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Más información
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
