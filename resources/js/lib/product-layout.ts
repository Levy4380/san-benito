const PRODUCT_PAGES = new Set([
    'Patient/Home',
    'Patient/Book',
    'Doctor/Home',
    'Doctor/Agenda',
    'Doctor/Program',
    'Doctor/MyPatients',
    'Doctor/PatientProfile',
    'Doctors/Index',
    'Doctors/Show',
    'Doctors/Specialties',
    'Doctors/Slots',
    'Appointments/Index',
    'Appointments/History',
    'Settings/Agenda',
    'Settings/Profile',
    'Settings/Password',
    'Admin/Appointments',
    'Admin/Doctors',
    'Admin/DoctorCreate',
    'Admin/Patients',
    'Admin/PatientCreate',
    'Admin/Admins',
    'Admin/AdminCreate',
    'Admin/UserPatient',
    'Admin/Settings',
    'Admin/Specialties',
    'Admin/SpecialtyCreate',
    'Admin/SpecialtyEdit',
]);

const HOME_PAGES = new Set(['Patient/Home', 'Doctor/Home']);

export function isProductPage(name: string): boolean {
    return PRODUCT_PAGES.has(name);
}

export function isHomePage(name: string): boolean {
    return HOME_PAGES.has(name);
}
