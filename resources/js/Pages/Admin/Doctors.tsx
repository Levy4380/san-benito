import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import SearchableChecks from '@/Components/Form/SearchableChecks';
import TextInput from '@/Components/Form/TextInput';
import DoctorCard, { DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, Specialty } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Props = {
    doctors: DoctorRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function AdminDoctors({ doctors, specialties, filters }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        license_number: '',
        specialty_ids: [] as number[],
        phone: '',
    });
    const [creating, setCreating] = useState(() => form.hasErrors);
    const hasFilters = filters.q.trim() !== '' || (filters.specialty_id !== '' && filters.specialty_id !== 'all');

    const toggleSpecialty = (id: number, checked: boolean) => {
        const current = form.data.specialty_ids;
        form.setData('specialty_ids', checked ? [...current, id] : current.filter((item) => item !== id));
    };

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
                        onBack={creating ? () => setCreating(false) : undefined}
                        backLabel="Doctores"
                        actions={
                            creating ? undefined : (
                                <Btn type="button" onClick={() => setCreating(true)}>
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear doctor
                                </Btn>
                            )
                        }
                    />
                }
            >
                <StageCard>
                    {creating ? (
                        <Results className="gap-[var(--space-md)]">
                            <form
                                className="grid min-h-0 flex-1 content-start overflow-auto"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    form.post('/admin/doctors', {
                                        preserveState: true,
                                        onSuccess: () => {
                                            form.reset();
                                            setCreating(false);
                                        },
                                    });
                                }}
                            >
                                <Field label="Nombre" htmlFor="name">
                                    <TextInput
                                        id="name"
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Correo" htmlFor="email">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Contraseña" htmlFor="password">
                                    <TextInput
                                        id="password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Matrícula" htmlFor="license_number">
                                    <TextInput
                                        id="license_number"
                                        value={form.data.license_number}
                                        onChange={(event) => form.setData('license_number', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Especialidades" error={form.errors.specialty_ids}>
                                    <SearchableChecks
                                        items={specialties}
                                        searchId="specialty_search"
                                        searchLabel="Buscar especialidad"
                                        empty="Todavía no hay especialidades."
                                        emptyFiltered="No hay especialidades con ese nombre."
                                    >
                                        {(specialty) => (
                                            <CheckLabel
                                                checked={form.data.specialty_ids.includes(specialty.id)}
                                                onChange={(checked) => toggleSpecialty(specialty.id, checked)}
                                            >
                                                {specialty.name}
                                            </CheckLabel>
                                        )}
                                    </SearchableChecks>
                                </Field>
                                <Btn type="submit" disabled={form.processing}>
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear doctor
                                </Btn>
                            </form>
                        </Results>
                    ) : (
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
                                        <DoctorCard key={doctor.id} asChild>
                                            <Link href={`/doctors/${doctor.id}`}>
                                                <strong>{doctor.user.name}</strong>
                                                <span>{specialtyNames(doctor.specialties)}</span>
                                                <span>{doctor.license_number}</span>
                                            </Link>
                                        </DoctorCard>
                                    ))}
                                </DoctorGrid>
                            )}
                        </Results>
                    )}
                </StageCard>
            </PageScreen>
        </>
    );
}
