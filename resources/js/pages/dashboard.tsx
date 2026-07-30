import { PageHeader } from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.user?.roles ?? [];

    const links: Array<{ href: string; label: string; hint: string }> = [];

    if (roles.includes('patient')) {
        links.push(
            { href: '/doctors', label: 'Doctores', hint: 'Buscar y reservar' },
            { href: '/my-appointments', label: 'Mis turnos', hint: 'Ver tu agenda' },
        );
    }
    if (roles.includes('doctor')) {
        links.push(
            { href: '/agenda', label: 'Mi agenda', hint: 'Horarios y turnos del día' },
            { href: '/my-patients', label: 'Mis pacientes', hint: 'Pacientes vinculados' },
        );
    }
    if (roles.includes('admin') || roles.includes('super_admin')) {
        links.push(
            { href: '/admin/appointments', label: 'Turnos', hint: 'Vista institucional' },
            { href: '/admin/doctors', label: 'Doctores', hint: 'Altas y slots' },
        );
    }
    if (roles.includes('super_admin')) {
        links.push({ href: '/admin/users', label: 'Usuarios', hint: 'Roles de administración' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />
            <div className="page-shell">
                <PageHeader
                    title={`Hola, ${auth.user?.name?.split(' ')[0] ?? ''}`}
                    description="Elegí a dónde ir. La agenda es el centro de San Benito."
                />

                <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                    {links.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className="flex flex-col gap-1 py-5 transition-colors hover:text-[var(--color-accent)] sm:flex-row sm:items-baseline sm:justify-between"
                            >
                                <span className="font-display text-[length:var(--text-lg)]">{item.label}</span>
                                <span className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">{item.hint}</span>
                            </Link>
                        </li>
                    ))}
                    {links.length === 0 && (
                        <li className="py-8 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                            No hay destinos para tu rol.
                        </li>
                    )}
                </ul>
            </div>
        </AppLayout>
    );
}
