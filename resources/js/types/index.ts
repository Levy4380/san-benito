export type RoleName = 'patient' | 'professional' | 'admin' | 'super_admin';

export type ToastVariant = 'ok' | 'warn' | 'info';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    roles: RoleName[];
    permissions: string[];
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

export type HealthInsurance = {
    id: number;
    name: string;
};

export type ProfessionalRecord = {
    id: number;
    license_number: string;
    slot_duration_minutes: number;
    user: { id: number; name: string; email: string; phone: string | null };
    specialties: Specialty[];
};

export type PatientRecord = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    dni: string;
    birth_date: string;
    health_insurance: string | null;
    user: { id: number; name: string; email: string; phone: string | null } | null;
};

export type Slot = {
    starts_at: string;
    ends_at: string;
};

export type AppointmentRecord = {
    id: number;
    professional_id: number;
    patient_id: number;
    specialty_id: number;
    starts_at: string;
    ends_at: string;
    professional?: ProfessionalRecord;
    patient?: PatientRecord;
    specialty?: Specialty;
};

export type AvailabilityWindowRecord = {
    id: number;
    professional_id: number;
    starts_at: string;
    ends_at: string;
};
