import type { RoleName } from '@/types';

export function primaryRole(roles: RoleName[]): RoleName {
    if (roles.includes('super_admin')) {
        return 'super_admin';
    }
    if (roles.includes('admin')) {
        return 'admin';
    }
    if (roles.includes('professional')) {
        return 'professional';
    }

    return 'patient';
}

export function canSeeAppointmentProfessional(roles: RoleName[]): boolean {
    const role = primaryRole(roles);

    return role !== 'professional';
}

export function canSeeAppointmentPatient(roles: RoleName[]): boolean {
    const role = primaryRole(roles);

    return role !== 'patient';
}
