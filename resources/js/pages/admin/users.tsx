import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    roles: string[];
};

type Props = {
    users: AdminUser[];
};

export default function AdminUsers({ users }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'admin',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Usuarios', href: '/admin/users' }]}>
            <Head title="Usuarios" />
            <div className="page-shell page-shell--wide">
                <PageHeader title="Usuarios y roles" description="Alta de administradores de la institución." />

                <section className="surface">
                    <h2 className="font-display text-[length:var(--text-lg)]">Alta de administrador</h2>
                    <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rol</Label>
                            <select
                                id="role"
                                className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                            >
                                <option value="admin">Administrador</option>
                                <option value="super_admin">Super administrador</option>
                            </select>
                            <InputError message={errors.role} />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={processing}>
                                Crear usuario
                            </Button>
                        </div>
                    </form>
                </section>

                <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                    {users.map((user) => (
                        <li key={user.id} className="py-4">
                            <p className="font-display text-[length:var(--text-md)]">{user.name}</p>
                            <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                {user.email} · Roles: {user.roles.join(', ') || '—'}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </AppLayout>
    );
}
