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
import type { RoleName } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';

type StaffRole = { name: string } | string;

type StaffUser = {
    id: number;
    name: string;
    email: string;
    roles?: StaffRole[];
};

type Props = {
    users: StaffUser[];
    filters: { q: string };
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
    const hasFilters = filters.q.trim() !== '';

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
                        actions={
                            <Btn asChild>
                                <Link href="/admin/admins/create">
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear administrador
                                </Link>
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Results>
                        <Filters onSubmit={submitFilters}>
                            <Field label="Nombre o correo" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} />
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
                </StageCard>
            </PageScreen>
        </>
    );
}
