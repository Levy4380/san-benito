import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Results from '@/Components/Surfaces/Results';
import type { HealthInsurance, Specialty } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';

type Props = {
    specialties: Specialty[];
    healthInsurances: HealthInsurance[];
};

export default function AdminDoctorCreate({ specialties, healthInsurances }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        license_number: '',
        specialty_ids: [] as number[],
        health_insurance_ids: [] as number[],
        phone: '',
    });

    return (
        <>
            <Head title="Crear doctor" />
            <PageScreen header={<PageHeader title="Doctores" description="Alta de profesionales." backHref="/admin/doctors" backLabel="Doctores" />}>
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
                                <TextInput id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
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
                            <Field label="Especialidades" htmlFor="specialty_ids" error={form.errors.specialty_ids}>
                                <Combobox
                                    id="specialty_ids"
                                    multiple
                                    value={form.data.specialty_ids.map(String)}
                                    placeholder="Elegí especialidades"
                                    searchLabel="Buscar especialidad"
                                    empty="Todavía no hay especialidades."
                                    emptyFiltered="No hay especialidades con ese nombre."
                                    onChange={(values) => form.setData('specialty_ids', values.map(Number))}
                                    options={specialties.map((specialty) => ({
                                        value: String(specialty.id),
                                        label: specialty.name,
                                    }))}
                                />
                            </Field>
                            <Field label="Obras sociales (opcional)" htmlFor="health_insurance_ids" error={form.errors.health_insurance_ids}>
                                <Combobox
                                    id="health_insurance_ids"
                                    multiple
                                    value={form.data.health_insurance_ids.map(String)}
                                    placeholder="Elegí obras sociales"
                                    searchLabel="Buscar obra social"
                                    empty="Todavía no hay obras sociales."
                                    emptyFiltered="No hay obras sociales con ese nombre."
                                    onChange={(values) => form.setData('health_insurance_ids', values.map(Number))}
                                    options={healthInsurances.map((healthInsurance) => ({
                                        value: String(healthInsurance.id),
                                        label: healthInsurance.name,
                                    }))}
                                />
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
