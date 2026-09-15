import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Results from '@/Components/Surfaces/Results';
import { Head, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';

export default function AdminPatientCreate() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        dni: '',
        birth_date: '',
        phone: '',
        health_insurance: '',
    });

    return (
        <>
            <Head title="Crear paciente" />
            <PageScreen
                header={
                    <PageHeader
                        title="Pacientes"
                        description="Alta de pacientes. Solo super admin."
                        backHref="/admin/patients"
                        backLabel="Pacientes"
                    />
                }
            >
                <StageCard>
                    <Results className="gap-[var(--space-md)]">
                        <form
                            className="grid min-h-0 flex-1 content-start overflow-auto"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post('/admin/patients');
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
                </StageCard>
            </PageScreen>
        </>
    );
}
