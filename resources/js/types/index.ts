export type RoleName = 'patient' | 'doctor' | 'admin' | 'super_admin';

export type ToastVariant = 'ok' | 'warn' | 'info';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    roles: RoleName[];
};

export type SharedData = {
    name: string;
    auth: { user: AuthUser | null };
    flash: { toast: { message: string; variant: ToastVariant } | null };
    errors?: Record<string, string | string[]>;
    [key: string]: unknown;
};

export type Specialty = {
    id: number;
    name: string;
};

export type DoctorRecord = {
    id: number;
    license_number: string;
    slot_duration_minutes: number;
    specialty_id: number;
    user: { id: number; name: string; email: string; phone: string | null };
    specialty: Specialty;
};

export type PatientRecord = {
    id: number;
    dni: string;
    birth_date: string;
    health_insurance: string | null;
    user: { id: number; name: string; email: string; phone: string | null };
};

export type Slot = {
    starts_at: string;
    ends_at: string;
};

export type AppointmentRecord = {
    id: number;
    doctor_id: number;
    patient_id: number;
    starts_at: string;
    ends_at: string;
    doctor?: DoctorRecord;
    patient?: PatientRecord;
};

export type AvailabilityWindowRecord = {
    id: number;
    doctor_id: number;
    starts_at: string;
    ends_at: string;
};
