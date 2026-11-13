import { Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarClock,
    CalendarPlus,
    ChevronDown,
    ClipboardList,
    ClipboardPlus,
    LogOut,
    NotebookPen,
    Settings,
    Shield,
    Stethoscope,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Btn } from '@/Components/Form/Btn';
import { focusVisibleClass } from '@/lib/clinico-control';
import { hasPermission, Permission, type PermissionName } from '@/lib/permissions';
import { primaryRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import type { RoleName, SharedData, SurgerySection } from '@/types';

type NavLink = { href: string; label: string; icon: LucideIcon; permission: PermissionName };
type SurgeryChild = { section: SurgerySection; label: string };
type RouteChild = { href: string; label: string; permission: PermissionName };
type NavGroup = {
    id: string;
    label: string;
    icon: LucideIcon;
    permission: PermissionName | null;
    children: Array<SurgeryChild | RouteChild>;
};
type NavEntry = NavLink | NavGroup;

const portalNav: NavLink[] = [
    { href: '/paciente/profesionales', label: 'Profesionales', icon: Stethoscope, permission: Permission.ProfessionalsBrowse },
    { href: '/paciente/mis-turnos', label: 'Mis turnos', icon: CalendarClock, permission: Permission.OwnAppointmentsView },
    { href: '/paciente/reserva', label: 'Reservar turno', icon: NotebookPen, permission: Permission.AppointmentsBook },
    { href: '/profesional/agenda', label: 'Mi agenda', icon: Calendar, permission: Permission.OwnAgendaView },
    { href: '/profesional/programar', label: 'Programar turnos', icon: CalendarPlus, permission: Permission.OwnAvailabilityProgram },
    { href: '/profesional/mis-pacientes', label: 'Mis pacientes', icon: Users, permission: Permission.OwnPatientsView },
    { href: '/profesional/configuracion/agenda', label: 'Config. agenda', icon: Settings, permission: Permission.OwnAgendaSettingsUpdate },
];

const surgeryChildren: SurgeryChild[] = [
    { section: 'pending', label: 'Pendientes' },
    { section: 'requested', label: 'Solicitadas' },
    { section: 'approved', label: 'Aprobadas' },
    { section: 'history', label: 'Historial' },
];

const staffNav: NavEntry[] = [
    { href: '/admin/reservas', label: 'Reservas', icon: ClipboardList, permission: Permission.AppointmentsCatalogView },
    {
        id: 'cirugias',
        label: 'Cirugías',
        icon: ClipboardPlus,
        permission: Permission.SurgeriesCatalogView,
        children: surgeryChildren,
    },
    { href: '/admin/profesionales', label: 'Profesionales', icon: Stethoscope, permission: Permission.ProfessionalsCatalogView },
    { href: '/admin/pacientes', label: 'Pacientes', icon: Users, permission: Permission.PatientsCatalogView },
    {
        id: 'administracion',
        label: 'Administración',
        icon: Shield,
        permission: null,
        children: [
            { href: '/admin/administradores', label: 'Administradores', permission: Permission.AdminsManage },
            { href: '/admin/configuracion', label: 'Configuración', permission: Permission.SpecialtiesManage },
        ],
    },
];

const rowClass =
    'flex w-full min-w-0 items-center gap-[0.35rem] overflow-hidden rounded-md text-left text-ink-2 max-[1199px]:min-h-[var(--control-h)] max-[1199px]:text-[length:var(--text-md)]';

type Props = {
    isHome: boolean;
    navOpen: boolean;
    userOpen: boolean;
};

export default function Sidebar({ isHome, navOpen, userOpen }: Props) {
    const page = usePage<SharedData>();
    const user = page.props.auth.user;
    const path = page.url.split('?')[0];
    const activeGroup = groupForPath(path);
    const open = navOpen || userOpen;
    const [mobilePanel, setMobilePanel] = useState<'nav' | 'user'>('nav');
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => (activeGroup ? { [activeGroup]: true } : {}));

    useEffect(() => {
        if (navOpen) {
            setMobilePanel('nav');
        } else if (userOpen) {
            setMobilePanel('user');
        }
    }, [navOpen, userOpen]);

    useEffect(() => {
        if (!activeGroup) {
            return;
        }

        setOpenGroups((current) => (current[activeGroup] ? current : { ...current, [activeGroup]: true }));
    }, [activeGroup]);

    if (!user) {
        return null;
    }

    const role = primaryRole(user.roles);
    const nav = navFor(user.permissions);
    const roleLabel = roleLabelFor(role);
    const listSection = surgerySection(page.url, path);
    const counts = page.props.surgeryNavCounts;

    return (
        <aside
            aria-label="Navegación"
            data-app-sidebar=""
            data-open={open || undefined}
            className={cn(
                'relative flex w-full min-w-0 max-w-full flex-col gap-[var(--space-lg)] bg-transparent p-[var(--space-md)]',
                'min-[1200px]:col-start-1 min-[1200px]:row-start-1 min-[1200px]:z-40 min-[1200px]:h-full min-[1200px]:min-h-0 min-[1200px]:overflow-hidden min-[1200px]:pt-[calc(var(--space-md)+var(--brand-logo-size)+var(--sidebar-brand-gap))]',
                isHome && 'min-[1200px]:overflow-visible min-[1200px]:px-0',
                'max-[1199px]:absolute max-[1199px]:inset-0 max-[1199px]:z-[56] max-[1199px]:h-full max-[1199px]:w-full max-[1199px]:gap-[var(--space-sm)] max-[1199px]:overflow-hidden max-[1199px]:rounded-[var(--app-radius)] max-[1199px]:bg-paper max-[1199px]:p-[var(--space-sm)] max-[1199px]:pt-[calc(var(--mobile-header-h)+var(--space-sm))]',
            )}
        >
            <Link
                href="/"
                id="brand-home"
                aria-label="Ir al inicio"
                className={cn(
                    'relative z-[1] flex w-max max-w-full items-center gap-[0.65rem] font-display font-semibold tracking-[-0.02em] text-ink no-underline',
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
                    'flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-[var(--space-lg)] overflow-hidden',
                    isHome &&
                        'min-[1200px]:w-[calc(var(--sidebar-w)-var(--space-md)*2)] min-[1200px]:max-w-[calc(var(--sidebar-w)-var(--space-md)*2)] min-[1200px]:min-w-[calc(var(--sidebar-w)-var(--space-md)*2)] min-[1200px]:overflow-visible',
                    mobilePanel === 'nav' ? 'max-[1199px]:gap-[var(--space-sm)]' : 'max-[1199px]:hidden',
                )}
            >
                <SidebarScroll
                    className={cn(
                        'transition-[opacity,transform,visibility] duration-[320ms] ease-out',
                        isHome && 'min-[1200px]:pointer-events-none min-[1200px]:invisible min-[1200px]:-translate-x-5 min-[1200px]:opacity-0',
                    )}
                >
                    {nav.map((item) => {
                        if ('children' in item) {
                            return (
                                <SidebarGroup
                                    key={item.id}
                                    group={item}
                                    open={openGroups[item.id] === true}
                                    path={path}
                                    listSection={listSection}
                                    counts={counts}
                                    onToggle={() => setOpenGroups((current) => ({ ...current, [item.id]: !current[item.id] }))}
                                />
                            );
                        }

                        const active = isActiveRoute(path, item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    rowClass,
                                    'min-h-[var(--control-h-sm)] px-[0.65rem] py-[0.55rem] whitespace-nowrap no-underline hover:bg-paper hover:text-ink',
                                    'max-[1199px]:px-[0.85rem] max-[1199px]:py-[0.75rem] max-[1199px]:hover:bg-paper-2',
                                    focusVisibleClass,
                                    active && 'bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink max-[1199px]:hover:bg-accent',
                                )}
                            >
                                <item.icon className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </SidebarScroll>
                <div
                    className={cn(
                        'min-w-0 shrink-0 overflow-hidden border-t border-rule pt-[var(--space-md)] text-sm text-ink-2',
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
                    'min-h-0 w-full min-w-0 flex-1 flex-col justify-end gap-[var(--space-sm)] overflow-hidden',
                    'min-[1200px]:hidden',
                    mobilePanel === 'user' ? 'max-[1199px]:flex' : 'max-[1199px]:hidden',
                )}
            >
                <div className="shrink-0 border-t border-rule pt-[var(--space-md)] text-sm text-ink-2 max-[1199px]:pt-[var(--space-sm)] max-[1199px]:text-[length:var(--text-md)]">
                    <SessionFoot name={user.name} roleLabel={roleLabel} />
                </div>
            </div>
        </aside>
    );
}

function SidebarGroup({
    group,
    open,
    path,
    listSection,
    counts,
    onToggle,
}: {
    group: NavGroup;
    open: boolean;
    path: string;
    listSection: SurgerySection | null;
    counts: SharedData['surgeryNavCounts'];
    onToggle: () => void;
}) {
    const current = groupIsCurrent(group, path);
    const panelId = `nav-${group.id}-links`;

    return (
        <div className="grid min-w-0 gap-0">
            <button
                type="button"
                id={`nav-${group.id}`}
                aria-expanded={open}
                aria-controls={panelId}
                className={cn(
                    rowClass,
                    'min-h-[var(--control-h-sm)] cursor-pointer border-0 bg-transparent px-[0.65rem] py-[0.55rem] hover:bg-paper hover:text-ink',
                    'max-[1199px]:px-[0.85rem] max-[1199px]:py-[0.75rem] max-[1199px]:hover:bg-paper-2',
                    focusVisibleClass,
                    current && 'font-semibold text-ink',
                )}
                onClick={onToggle}
            >
                <group.icon className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                <ChevronDown
                    className={cn(
                        'size-[1.05rem] shrink-0 transition-transform duration-[220ms] ease-[var(--ease-out)] motion-reduce:transition-none',
                        !open && '-rotate-90',
                    )}
                    aria-hidden
                    strokeWidth={2}
                />
            </button>
            <div
                id={panelId}
                className={cn(
                    'grid transition-[grid-template-rows] duration-[220ms] ease-[var(--ease-out)] motion-reduce:transition-none',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden" inert={!open}>
                    <div className="ml-[1.05rem] grid min-w-0 gap-[0.15rem] border-l border-rule pt-[0.15rem] pl-[0.55rem]">
                        {group.children.map((child) => {
                            if ('section' in child) {
                                const active = listSection === child.section;

                                return (
                                    <Link
                                        key={child.section}
                                        href={`/admin/cirugias?section=${child.section}`}
                                        aria-current={active ? 'page' : undefined}
                                        tabIndex={open ? undefined : -1}
                                        className={cn(
                                            rowClass,
                                            'min-h-8 px-[0.6rem] py-[0.4rem] text-sm whitespace-nowrap no-underline hover:bg-paper hover:text-ink',
                                            'max-[1199px]:py-[0.65rem] max-[1199px]:hover:bg-paper-2',
                                            focusVisibleClass,
                                            active && 'bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink max-[1199px]:hover:bg-accent',
                                        )}
                                    >
                                        <span className="min-w-0 flex-1 truncate">{child.label}</span>
                                        <span className="shrink-0 font-mono text-xs tabular-nums">{counts?.[child.section] ?? 0}</span>
                                    </Link>
                                );
                            }

                            const active = isActiveRoute(path, child.href);

                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    aria-current={active ? 'page' : undefined}
                                    tabIndex={open ? undefined : -1}
                                    className={cn(
                                        rowClass,
                                        'min-h-8 px-[0.6rem] py-[0.4rem] text-sm whitespace-nowrap no-underline hover:bg-paper hover:text-ink',
                                        'max-[1199px]:py-[0.65rem] max-[1199px]:hover:bg-paper-2',
                                        focusVisibleClass,
                                        active && 'bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink max-[1199px]:hover:bg-accent',
                                    )}
                                >
                                    <span className="min-w-0 flex-1 truncate">{child.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarScroll({ children, className }: { children: ReactNode; className?: string }) {
    const scrollerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const { thumb, onScroll } = useOverlayThumb(scrollerRef, contentRef);

    return (
        <div className="relative min-h-0 w-full min-w-0 flex-1">
            <nav
                ref={scrollerRef}
                aria-label="Secciones"
                data-sidebar-scroll=""
                className={cn('absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain', className)}
                onScroll={onScroll}
            >
                <div ref={contentRef} className="grid min-w-0 content-start gap-[0.2rem]">
                    {children}
                </div>
            </nav>
            {thumb ? (
                <div className="pointer-events-none absolute inset-y-1 right-[3px] w-1" aria-hidden>
                    <div
                        className={cn(
                            'w-full rounded-full bg-ink/50 transition-opacity duration-300 motion-reduce:transition-none',
                            thumb.visible ? 'opacity-100' : 'opacity-0',
                        )}
                        style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }}
                    />
                </div>
            ) : null}
        </div>
    );
}

function useOverlayThumb(scrollerRef: RefObject<HTMLElement | null>, contentRef: RefObject<HTMLDivElement | null>) {
    const [thumb, setThumb] = useState<{ height: number; top: number; visible: boolean } | null>(null);
    const visibleRef = useRef(false);
    const hideTimer = useRef(0);

    const measure = (visible: boolean) => {
        const scroller = scrollerRef.current;

        if (!scroller) {
            return;
        }

        const { scrollHeight, clientHeight, scrollTop } = scroller;

        if (scrollHeight <= clientHeight + 1) {
            setThumb(null);
            return;
        }

        const track = Math.max(clientHeight - 8, 1);
        const height = Math.min(track, Math.max(28, (clientHeight / scrollHeight) * track));
        const maxTop = Math.max(track - height, 0);
        const top = scrollHeight === clientHeight ? 0 : (scrollTop / (scrollHeight - clientHeight)) * maxTop;

        setThumb({ height, top, visible });
    };

    const onScroll = () => {
        visibleRef.current = true;
        measure(true);
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
            visibleRef.current = false;
            measure(false);
        }, 700);
    };

    useEffect(() => {
        const scroller = scrollerRef.current;
        const content = contentRef.current;

        if (!scroller || !content) {
            return;
        }

        const onResize = () => measure(visibleRef.current);
        onResize();
        const observer = new ResizeObserver(onResize);
        observer.observe(scroller);
        observer.observe(content);

        return () => {
            window.clearTimeout(hideTimer.current);
            observer.disconnect();
        };
    }, [contentRef, scrollerRef]);

    return { thumb, onScroll };
}

function SessionFoot({ name, roleLabel }: { name: string; roleLabel: string }) {
    return (
        <>
            <strong className="mb-[0.15rem] block overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-ink">{name}</strong>
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{roleLabel}</span>
            <nav className="mt-3 grid gap-[0.15rem] max-[1199px]:gap-[0.35rem]" aria-label="Cuenta">
                <Link
                    href="/settings/profile"
                    className={cn(
                        'inline-flex min-h-[var(--control-h-sm)] min-w-0 items-center gap-[0.35rem] overflow-hidden rounded-md text-ink-2 whitespace-nowrap no-underline hover:text-ink',
                        'max-[1199px]:min-h-[var(--control-h)] max-[1199px]:px-[0.35rem]',
                        focusVisibleClass,
                    )}
                >
                    <User className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    <span className="min-w-0 truncate">Mi perfil</span>
                </Link>
            </nav>
            <Btn type="button" variant="outline" size="sm" block className="mt-3 max-[1199px]:h-[var(--control-h)] max-[1199px]:min-h-[var(--control-h)] max-[1199px]:text-sm" onClick={() => router.post('/logout')}>
                <LogOut className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Cerrar sesión
            </Btn>
        </>
    );
}

export function isActiveRoute(path: string, href: string): boolean {
    return path === href || path.startsWith(`${href}/`);
}

function navFor(permissions: string[]): NavEntry[] {
    const source: NavEntry[] = hasPermission(permissions, Permission.PortalHome) ? portalNav : staffNav;
    const visible: NavEntry[] = [];

    for (const item of source) {
        if (!('children' in item)) {
            if (hasPermission(permissions, item.permission)) {
                visible.push(item);
            }
            continue;
        }

        if (item.permission) {
            if (hasPermission(permissions, item.permission)) {
                visible.push(item);
            }
            continue;
        }

        const children = item.children.filter((child): child is RouteChild => 'href' in child && hasPermission(permissions, child.permission));

        if (children.length > 0) {
            visible.push({ ...item, children });
        }
    }

    return visible;
}

function groupForPath(path: string): string | null {
    if (path === '/admin/cirugias' || path.startsWith('/admin/cirugias/')) {
        return 'cirugias';
    }

    if (path === '/admin/administradores' || path.startsWith('/admin/administradores/') || path === '/admin/configuracion' || path.startsWith('/admin/configuracion/')) {
        return 'administracion';
    }

    return null;
}

function groupIsCurrent(group: NavGroup, path: string): boolean {
    if (group.id === 'cirugias') {
        return path === '/admin/cirugias' || path.startsWith('/admin/cirugias/');
    }

    return group.children.some((child) => 'href' in child && isActiveRoute(path, child.href));
}

function surgerySection(url: string, path: string): SurgerySection | null {
    if (path !== '/admin/cirugias') {
        return null;
    }

    const section = new URLSearchParams(url.split('?')[1] ?? '').get('section');

    if (section === 'requested' || section === 'approved' || section === 'history') {
        return section;
    }

    return 'pending';
}

function roleLabelFor(role: RoleName): string {
    if (role === 'professional') {
        return 'Profesional';
    }
    if (role === 'admin') {
        return 'Admin';
    }
    if (role === 'super_admin') {
        return 'Super admin';
    }

    return 'Paciente';
}
