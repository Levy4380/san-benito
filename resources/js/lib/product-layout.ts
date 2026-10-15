const PRODUCT_PAGES = new Set([
    'Patient/Home',
    'Patient/Book',
    'Professional/Home',
    'Professional/Agenda',
    'Professional/Program',
    'Professional/MyPatients',
    'Professional/PatientProfile',
    'Professionals/Index',
    'Professionals/Show',
    'Professionals/Specialties',
    'Professionals/HealthInsurances',
    'Professionals/Slots',
    'Appointments/Index',
    'Appointments/History',
    'Settings/Agenda',
    'Settings/Profile',
    'Settings/Password',
    'Admin/Appointments',
    'Admin/Surgeries',
    'Admin/SurgeryCalendar',
    'Admin/Professionals',
    'Admin/Patients',
    'Admin/Admins',
    'Admin/AdminCreate',
    'Admin/UserPatient',
    'Admin/Settings',
    'Admin/Specialties',
    'Admin/SpecialtyCreate',
    'Admin/SpecialtyEdit',
    'Admin/HealthInsurances',
    'Admin/HealthInsuranceCreate',
    'Admin/HealthInsuranceEdit',
]);

const HOME_PAGES = new Set(['Patient/Home', 'Professional/Home']);

export function isProductPage(name: string): boolean {
    return PRODUCT_PAGES.has(name);
}

export function isHomePage(name: string): boolean {
    return HOME_PAGES.has(name);
}
