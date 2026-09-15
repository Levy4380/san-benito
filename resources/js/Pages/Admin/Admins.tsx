import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import TextInput from '@/Components/Form/TextInput';
import DoctorCard, { DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import type { RoleName } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type StaffRole = { name: string } | string;

type StaffUser = {
    id: number;
    name: string;
    email: string;
    roles?: StaffRole[];
};

type Props = {
    users: StaffUser[];
    filters: { name: string; email: string };
};

function roleNames(roles: StaffRole[] | undefined): RoleName[] {
    return (roles ?? []).map((role) => (typeof role === 'string' ? role : role.name) as RoleName);
}

function staffRoleLabel(roles: StaffRole[] | undefined): string {
    const names = roleNames(roles);

    if (names.includes('super_admin')) {
        return 'Super admin';
    }

    if (names.includes('admin')) {
        return 'Admin';
    }

    return 'Staff';
}

export default function AdminAdmins({ users, filters }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
    });
    const [creating, setCreating] = useState(() => form.hasErrors);
    const hasFilters = filters.name.trim() !== '' || filters.email.trim() !== '';

    const submitFilters: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/admins', Object.fromEntries(data), { preserveState: true });
    };

    return (
        <>
            <Head title="Administradores" />
            <PageScreen
                header={
                    <PageHeader
                        title="Administradores"
                        description="Alta de admins. Solo super admin."
                        onBack={creating ? () => setCreating(false) : undefined}
                        backLabel="Administradores"
                        actions={
                            creating ? undefined : (
                                <Btn type="button" onClick={() => setCreating(true)}>
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear administrador
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
                                    form.post('/admin/admins', {
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
                                <Field label="Rol" htmlFor="role">
                                    <NativeSelect id="role" value={form.data.role} onChange={(event) => form.setData('role', event.target.value)}>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super admin</option>
                                    </NativeSelect>
                                </Field>
                                <Btn type="submit" disabled={form.processing}>
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear administrador
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
                            {users.length === 0 ? (
                                <Empty>
                                    {hasFilters ? 'No hay administradores con esos filtros.' : 'Todavía no hay administradores.'}
                                </Empty>
                            ) : (
                                <DoctorGrid>
                                    {users.map((user) => (
                                        <DoctorCard key={user.id} as="div">
                                            <strong>{user.name}</strong>
                                            <span>{user.email}</span>
                                            <span>{staffRoleLabel(user.roles)}</span>
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
