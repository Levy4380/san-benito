import AdminSurgeryCalendar, { type SurgeryCalendarProps } from '@/Pages/Admin/SurgeryCalendar';
import { hasPermission, Permission } from '@/lib/permissions';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

const BASE_PATH = '/profesional/cirugias';

export default function ProfessionalSurgeryCalendar(props: SurgeryCalendarProps) {
    const page = usePage<SharedData>();
    const canSchedule = hasPermission(page.props.auth.user?.permissions, Permission.OwnSurgeriesSchedule);

    return (
        <AdminSurgeryCalendar
            {...props}
            basePath={BASE_PATH}
            createPermission={Permission.OwnSurgeriesCreate}
            hideProfessional
            canMarkRequested={false}
            canApprove={false}
            canSchedule={canSchedule}
            calendarDescription="Cirugías programadas propias."
        />
    );
}
