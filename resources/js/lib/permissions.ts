export const Permission = {
    PortalHome: 'portal.home',
    DoctorsBrowse: 'doctors.browse',
    AppointmentsBook: 'appointments.book',
    OwnAppointmentsView: 'own.appointments.view',
    OwnAppointmentsCancel: 'own.appointments.cancel',
    OwnAppointmentsAssign: 'own.appointments.assign',
    OwnAgendaView: 'own.agenda.view',
    OwnAgendaSettingsUpdate: 'own.agenda.settings.update',
    OwnPatientsView: 'own.patients.view',
    OwnPatientsLink: 'own.patients.link',
    OwnAvailabilityCreate: 'own.availability.create',
    OwnAvailabilityProgram: 'own.availability.program',
    OwnAvailabilityDelete: 'own.availability.delete',
    AppointmentsCancel: 'appointments.cancel',
    AppointmentsCatalogView: 'appointments.catalog.view',
    PatientsLink: 'patients.link',
    AvailabilityCreate: 'availability.create',
    AvailabilityProgram: 'availability.program',
    AvailabilityDelete: 'availability.delete',
    DoctorsCatalogView: 'doctors.catalog.view',
    DoctorsCreate: 'doctors.create',
    PatientsCatalogView: 'patients.catalog.view',
    PatientsCreate: 'patients.create',
    AdminsManage: 'admins.manage',
    SpecialtiesManage: 'specialties.manage',
} as const;

export type PermissionName = (typeof Permission)[keyof typeof Permission];

export function hasPermission(permissions: readonly string[] | undefined, permission: PermissionName): boolean {
    return Boolean(permissions?.includes(permission));
}
