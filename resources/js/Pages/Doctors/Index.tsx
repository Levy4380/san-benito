import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog from '@/Components/Surfaces/Catalog';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, Specialty } from '@/types';
import { Head, router } from '@inertiajs/react';
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
                    <Catalog
                        onSearch={submit}
                        empty={hasFilters ? 'No hay profesionales con esos filtros.' : 'Todavía no hay profesionales.'}
                        items={doctors.map((doctor) => ({
                            key: doctor.id,
                            title: doctor.user.name,
                            lines: [specialtyNames(doctor.specialties)],
                            actions: [
                                { kind: 'info', href: `/doctors/${doctor.id}`, name: doctor.user.name },
                                { kind: 'slots', href: `/doctors/${doctor.id}/slots` },
                            ],
                        }))}
                    >
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
                    </Catalog>
                </StageCard>
            </PageScreen>
        </>
    );
}
