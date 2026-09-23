import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Results from '@/Components/Surfaces/Results';
import { Head, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';

export default function AdminAdminCreate() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
    });

    return (
        <>
            <Head title="Crear administrador" />
            <PageScreen
                header={
                    <PageHeader
                        title="Administradores"
                        description="Alta de admins. Solo super admin."
                        backHref="/admin/admins"
                        backLabel="Administradores"
                    />
                }
            >
                <StageCard>
                    <Results className="gap-[var(--space-md)]">
                        <form
                            className="grid min-h-0 flex-1 content-start overflow-auto"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post('/admin/admins');
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
                            <Field label="Rol" htmlFor="role">
                                <Combobox
                                    id="role"
                                    value={form.data.role}
                                    onChange={(role) => form.setData('role', role)}
                                    options={[
                                        { value: 'admin', label: 'Admin' },
                                        { value: 'super_admin', label: 'Super admin' },
                                    ]}
                                />
                            </Field>
                            <Btn type="submit" disabled={form.processing}>
                                <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Crear administrador
                            </Btn>
                        </form>
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
