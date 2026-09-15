import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import DoctorCard, { DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import type { PatientRecord } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Props = {
    patients: PatientRecord[];
    filters: { name: string; email: string };
};

export default function AdminPatients({ patients, filters }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        dni: '',
        birth_date: '',
        phone: '',
        health_insurance: '',
    });
    const [creating, setCreating] = useState(() => form.hasErrors);
    const hasFilters = filters.name.trim() !== '' || filters.email.trim() !== '';

    const submitFilters: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/patients', Object.fromEntries(data), { preserveState: true });
    };

    return (
        <>
            <Head title="Pacientes" />
            <PageScreen
                header={
                    <PageHeader
                        title="Pacientes"
                        description="Alta de pacientes. Solo super admin."
                        onBack={creating ? () => setCreating(false) : undefined}
                        backLabel="Pacientes"
                        actions={
                            creating ? undefined : (
                                <Btn type="button" onClick={() => setCreating(true)}>
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear paciente
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
                                    form.post('/admin/patients', {
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
                                <Field label="DNI" htmlFor="dni">
                                    <TextInput
                                        id="dni"
                                        value={form.data.dni}
                                        onChange={(event) => form.setData('dni', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Fecha de nacimiento" htmlFor="birth_date">
                                    <TextInput
                                        id="birth_date"
                                        type="date"
                                        value={form.data.birth_date}
                                        onChange={(event) => form.setData('birth_date', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Teléfono (opcional)" htmlFor="phone">
                                    <TextInput
                                        id="phone"
                                        value={form.data.phone}
                                        onChange={(event) => form.setData('phone', event.target.value)}
                                    />
                                </Field>
                                <Field label="Obra social (opcional)" htmlFor="health_insurance">
                                    <TextInput
                                        id="health_insurance"
                                        value={form.data.health_insurance}
                                        onChange={(event) => form.setData('health_insurance', event.target.value)}
                                    />
                                </Field>
                                <Btn type="submit" disabled={form.processing}>
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear paciente
                                </Btn>
                            </form>
                        </Results>
                    ) : (
                        <Results>
                            <Filters onSubmit={submitFilters}>
                                <Field label="Nombre" htmlFor="filter_name" flush className="min-w-0">
                                    <TextInput id="filter_name" name="name" defaultValue={filters.name} />
                                </Field>
                                <Field label="Correo" htmlFor="filter_email" flush className="min-w-0">
                                    <TextInput id="filter_email" name="email" defaultValue={filters.email} />
                                </Field>
                                <Btn type="submit" className="self-end">
                                    <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Buscar
                                </Btn>
                            </Filters>
                            {patients.length === 0 ? (
                                <Empty>{hasFilters ? 'No hay pacientes con esos filtros.' : 'Todavía no hay pacientes.'}</Empty>
                            ) : (
                                <DoctorGrid>
                                    {patients.map((patient) => (
                                        <DoctorCard key={patient.id} asChild>
                                            <Link href={`/admin/patients/${patient.id}`}>
                                                <strong>{patient.user.name}</strong>
                                                <span>{patient.user.email}</span>
                                                <span>DNI {patient.dni}</span>
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
