import type { RoleName } from '@/types';

export function primaryRole(roles: RoleName[]): RoleName {
    if (roles.includes('super_admin')) {
        return 'super_admin';
    }
    if (roles.includes('admin')) {
        return 'admin';
    }
    if (roles.includes('doctor')) {
        return 'doctor';
    }

    return 'patient';
}

export function canSeeAppointmentDoctor(roles: RoleName[]): boolean {
    const role = primaryRole(roles);

    return role !== 'doctor';
}

export function canSeeAppointmentPatient(roles: RoleName[]): boolean {
    const role = primaryRole(roles);

    return role !== 'patient';
}
