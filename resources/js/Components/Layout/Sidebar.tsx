import { Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarClock,
    CalendarPlus,
    ClipboardList,
    LogOut,
    NotebookPen,
    Settings,
    Shield,
    Stethoscope,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/Components/Form/Btn';
import { focusVisibleClass } from '@/lib/clinico-control';
import { hasPermission, Permission, type PermissionName } from '@/lib/permissions';
import { primaryRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import type { RoleName, SharedData } from '@/types';

type NavItem = { href: string; label: string; icon: LucideIcon; permission: PermissionName };

const portalNav: NavItem[] = [
    { href: '/doctors', label: 'Doctores', icon: Stethoscope, permission: Permission.DoctorsBrowse },
    { href: '/my-appointments', label: 'Mis turnos', icon: CalendarClock, permission: Permission.OwnAppointmentsView },
    { href: '/book', label: 'Reservar turno', icon: NotebookPen, permission: Permission.AppointmentsBook },
    { href: '/agenda', label: 'Mi agenda', icon: Calendar, permission: Permission.OwnAgendaView },
    { href: '/agenda/program', label: 'Programar turnos', icon: CalendarPlus, permission: Permission.OwnAvailabilityProgram },
    { href: '/my-patients', label: 'Mis pacientes', icon: Users, permission: Permission.OwnPatientsView },
    { href: '/settings/agenda', label: 'Config. agenda', icon: Settings, permission: Permission.OwnAgendaSettingsUpdate },
];

const staffNav: NavItem[] = [
    { href: '/admin/appointments', label: 'Reservas', icon: ClipboardList, permission: Permission.AppointmentsCatalogView },
    { href: '/admin/doctors', label: 'Doctores', icon: Stethoscope, permission: Permission.DoctorsCatalogView },
    { href: '/admin/patients', label: 'Pacientes', icon: Users, permission: Permission.PatientsCatalogView },
    { href: '/admin/admins', label: 'Administradores', icon: Shield, permission: Permission.AdminsManage },
    { href: '/admin/settings', label: 'Configuración', icon: Settings, permission: Permission.SpecialtiesManage },
];

type Props = {
    isHome: boolean;
    navOpen: boolean;
    userOpen: boolean;
};

export default function Sidebar({ isHome, navOpen, userOpen }: Props) {
    const page = usePage<SharedData>();
    const user = page.props.auth.user;
    const path = page.url.split('?')[0];
    const open = navOpen || userOpen;
    const [mobilePanel, setMobilePanel] = useState<'nav' | 'user'>('nav');

    useEffect(() => {
        if (navOpen) {
            setMobilePanel('nav');
        } else if (userOpen) {
            setMobilePanel('user');
        }
    }, [navOpen, userOpen]);

    if (!user) {
        return null;
    }

    const role = primaryRole(user.roles);
    const hasHome = hasPermission(user.permissions, Permission.PortalHome);
    const nav = navFor(user.permissions);
    const roleLabel = roleLabelFor(role);

    return (
        <aside
            aria-label="Navegación"
            data-app-sidebar=""
            data-open={open || undefined}
            className={cn(
                'relative flex flex-col gap-[var(--space-lg)] bg-transparent p-[var(--space-md)]',
                'min-[1200px]:col-start-1 min-[1200px]:row-start-1 min-[1200px]:z-40 min-[1200px]:min-h-0 min-[1200px]:overflow-x-hidden min-[1200px]:overflow-y-auto min-[1200px]:pt-[calc(var(--space-md)+var(--brand-logo-size)+var(--sidebar-brand-gap))]',
                isHome && 'min-[1200px]:overflow-visible min-[1200px]:px-0',
                'max-[1199px]:absolute max-[1199px]:inset-0 max-[1199px]:z-[56] max-[1199px]:h-full max-[1199px]:w-full max-[1199px]:gap-[var(--space-sm)] max-[1199px]:overflow-x-hidden max-[1199px]:overflow-y-auto max-[1199px]:rounded-[var(--app-radius)] max-[1199px]:bg-paper max-[1199px]:p-[var(--space-sm)] max-[1199px]:pt-[calc(var(--app-frame)+var(--mobile-header-h)+var(--space-sm))]',
            )}
        >
            <Link
                href={hasHome ? '/home' : '/admin/appointments'}
                id="brand-home"
                aria-label="Ir al inicio"
                className={cn(
                    'relative z-[1] flex w-max items-center gap-[0.65rem] font-display font-semibold tracking-[-0.02em] text-ink no-underline',
                    'min-[1200px]:absolute min-[1200px]:top-[var(--space-md)] min-[1200px]:left-[var(--space-md)] min-[1200px]:z-[45]',
                    'max-[1199px]:hidden',
                )}
            >
                <img
                    src="/images/san-benito-logo.png"
                    width={56}
                    height={56}
                    alt=""
                    className="block size-[var(--brand-logo-size)] shrink-0 rounded-full bg-white object-contain shadow-[0_1px_4px_oklch(22%_0.02_255/0.14)]"
                />
                <span className="flex max-w-[11.5rem] shrink-0 flex-col gap-[0.1rem] leading-[1.12] whitespace-nowrap">
                    <span className="text-[0.8rem] font-medium tracking-[0.01em] text-ink-2">Sanatorio integral</span>
                    <span className="text-[1.2rem] font-bold tracking-[-0.03em] text-ink max-md:text-[1.05rem]">San Benito</span>
                </span>
            </Link>
            <div
                id="sidebar-nav-panel"
                className={cn(
                    'min-h-0 flex-1 flex-col gap-[var(--space-lg)]',
                    'min-[1200px]:flex min-[1200px]:w-[calc(var(--sidebar-w)-var(--space-md)*2)] min-[1200px]:min-w-[calc(var(--sidebar-w)-var(--space-md)*2)] min-[1200px]:shrink-0',
                    mobilePanel === 'nav' ? 'max-[1199px]:flex max-[1199px]:gap-[var(--space-sm)]' : 'max-[1199px]:hidden',
                )}
            >
                <nav
                    className={cn(
                        'grid gap-[0.2rem] transition-[opacity,transform,visibility] duration-[320ms] ease-out',
                        isHome && 'min-[1200px]:pointer-events-none min-[1200px]:invisible min-[1200px]:-translate-x-5 min-[1200px]:opacity-0',
                    )}
                >
                    {nav.map((item) => {
                        const active = isActiveRoute(path, item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-[0.35rem] overflow-hidden rounded-md px-[0.65rem] py-[0.55rem] text-left text-ink-2 whitespace-nowrap no-underline hover:bg-paper hover:text-ink',
                                    'max-[1199px]:px-[0.75rem] max-[1199px]:py-[0.7rem] max-[1199px]:hover:bg-paper-2',
                                    focusVisibleClass,
                                    active && 'bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink max-[1199px]:hover:bg-accent',
                                )}
                            >
                                <item.icon className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div
                    className={cn(
                        'mt-auto border-t border-rule pt-[var(--space-md)] text-sm text-ink-2',
                        'max-[1199px]:hidden',
                        isHome &&
                            'min-[1200px]:absolute min-[1200px]:bottom-[var(--space-md)] min-[1200px]:left-[var(--space-md)] min-[1200px]:z-[45] min-[1200px]:mt-0 min-[1200px]:w-[calc(var(--sidebar-w)-var(--space-md)*2)] min-[1200px]:border-t-0 min-[1200px]:pt-0',
                    )}
                >
                    <SessionFoot name={user.name} roleLabel={roleLabel} />
                </div>
            </div>
            <div
                id="sidebar-user-panel"
                className={cn(
                    'min-h-0 flex-1 flex-col gap-[var(--space-sm)]',
                    'min-[1200px]:hidden',
                    mobilePanel === 'user' ? 'max-[1199px]:flex' : 'max-[1199px]:hidden',
                )}
            >
                <div className="mt-auto border-t border-rule pt-[var(--space-md)] text-sm text-ink-2">
                    <SessionFoot name={user.name} roleLabel={roleLabel} />
                </div>
            </div>
        </aside>
    );
}

function SessionFoot({ name, roleLabel }: { name: string; roleLabel: string }) {
    return (
        <>
            <strong className="mb-[0.15rem] block overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-ink">{name}</strong>
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{roleLabel}</span>
            <nav className="mt-3 grid gap-[0.15rem]" aria-label="Cuenta">
                <Link
                    href="/settings/profile"
                    className={cn(
                        'inline-flex items-center gap-[0.35rem] overflow-hidden rounded-md text-ink-2 whitespace-nowrap no-underline hover:text-ink',
                        focusVisibleClass,
                    )}
                >
                    <User className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Mi perfil
                </Link>
            </nav>
            <Btn type="button" variant="outline" size="sm" block className="mt-3" onClick={() => router.post('/logout')}>
                <LogOut className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Cerrar sesión
            </Btn>
        </>
    );
}

export function isActiveRoute(path: string, href: string): boolean {
    return path === href || path.startsWith(`${href}/`);
}

function navFor(permissions: string[]): NavItem[] {
    const items = hasPermission(permissions, Permission.PortalHome) ? portalNav : staffNav;

    return items.filter((item) => hasPermission(permissions, item.permission));
}

function roleLabelFor(role: RoleName): string {
    if (role === 'doctor') {
        return 'Doctor';
    }
    if (role === 'admin') {
        return 'Admin';
    }
    if (role === 'super_admin') {
        return 'Super admin';
    }

    return 'Paciente';
}
