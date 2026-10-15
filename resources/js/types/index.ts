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

export type SurgeryNavCounts = {
    pending: number;
    requested: number;
    approved: number;
    history: number;
};

export type ClinicSchedule = {
    openDays: number[];
    opensAt: string;
    closesAt: string;
};

export type SharedData = {
    name: string;
    auth: { user: AuthUser | null };
    flash: { toast: { message: string; variant: ToastVariant } | null };
    surgeryNavCounts?: SurgeryNavCounts | null;
    clinic?: ClinicSchedule;
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
    health_insurances?: HealthInsurance[];
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

export type SurgeryStatusName = 'pending' | 'requested' | 'to_schedule' | 'scheduled';

export type SurgerySection = 'pending' | 'requested' | 'approved' | 'history';

export type SurgeryRecord = {
    id: number;
    patient_id: number;
    professional_id: number;
    health_insurance_id: number | null;
    requested_by_user_id: number;
    status: SurgeryStatusName;
    note: string;
    starts_at: string | null;
    ends_at: string | null;
    opens_scheduled_group?: boolean;
    patient?: PatientRecord;
    professional?: ProfessionalRecord;
    health_insurance?: HealthInsurance | null;
};

export type AvailabilityWindowRecord = {
    id: number;
    professional_id: number;
    starts_at: string;
    ends_at: string;
};
