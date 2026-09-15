import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import SearchableChecks from '@/Components/Form/SearchableChecks';
import TextInput from '@/Components/Form/TextInput';
import Results from '@/Components/Surfaces/Results';
import type { Specialty } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';

type Props = {
    specialties: Specialty[];
};

export default function AdminDoctorCreate({ specialties }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        license_number: '',
        specialty_ids: [] as number[],
        phone: '',
    });

    const toggleSpecialty = (id: number, checked: boolean) => {
        const current = form.data.specialty_ids;
        form.setData('specialty_ids', checked ? [...current, id] : current.filter((item) => item !== id));
    };

    return (
        <>
            <Head title="Crear doctor" />
            <PageScreen
                header={
                    <PageHeader
                        title="Doctores"
                        description="Alta de profesionales."
                        backHref="/admin/doctors"
                        backLabel="Doctores"
                    />
                }
            >
                <StageCard>
                    <Results className="gap-[var(--space-md)]">
                        <form
                            className="grid min-h-0 flex-1 content-start overflow-auto"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post('/admin/doctors');
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
                </StageCard>
            </PageScreen>
        </>
    );
}
