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
import type { DoctorRecord, Specialty } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';

type Props = {
    doctors: DoctorRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function AdminDoctors({ doctors, specialties, filters }: Props) {
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const apply = (data: FilterValues) => {
        router.get('/admin/doctors', data, { preserveState: true });
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
                    <Catalog
                        applied={{ specialty_id: filters.specialty_id || 'all' }}
                        onApply={apply}
                        empty={hasFilters ? 'No hay profesionales con esos filtros.' : 'Todavía no hay profesionales.'}
                        items={doctors.map((doctor) => ({
                            key: doctor.id,
                            title: doctor.user.name,
                            lines: [specialtyNames(doctor.specialties), doctor.license_number],
                            actions: [{ kind: 'info', href: `/doctors/${doctor.id}`, name: doctor.user.name }],
                        }))}
                        primary={
                            <Field label="Nombre" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} />
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
        </>
    );
}
