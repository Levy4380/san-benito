import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Calendar, CalendarDays, Contact, Stethoscope, Users, ClipboardList } from 'lucide-react';
import AppLogo from './app-logo';

function useMainNavItems(): NavItem[] {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.user?.roles ?? [];

    const items: NavItem[] = [];

    if (roles.includes('patient')) {
        items.push(
            { title: 'Doctores', url: '/doctors', icon: Stethoscope },
            { title: 'Mis turnos', url: '/my-appointments', icon: Calendar },
        );
    }

    if (roles.includes('doctor')) {
        items.push(
            { title: 'Mi agenda', url: '/agenda', icon: CalendarDays },
            { title: 'Mis pacientes', url: '/my-patients', icon: Contact },
        );
    }

    if (roles.includes('admin') || roles.includes('super_admin')) {
        items.push(
            { title: 'Turnos', url: '/admin/appointments', icon: ClipboardList },
            { title: 'Doctores', url: '/admin/doctors', icon: Stethoscope },
        );
    }

    if (roles.includes('super_admin')) {
        items.push({ title: 'Usuarios', url: '/admin/users', icon: Users });
    }

    return items;
}

export function AppSidebar() {
    const mainNavItems = useMainNavItems();
    const homeUrl = mainNavItems[0]?.url ?? '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
