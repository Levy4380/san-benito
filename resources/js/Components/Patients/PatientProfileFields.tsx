import { ProfileField, ProfileFields } from '@/Components/Common/DetailList';
import type { PatientRecord } from '@/types';

type Props = {
    patient: PatientRecord;
    /** Hide «Obra social» when the screen edits it in a form right below. */
    showHealthInsurance?: boolean;
    className?: string;
};

/** Patient profile (Mis pacientes, admin Pacientes page and info modal): same fields, same order. */
export default function PatientProfileFields({ patient, showHealthInsurance = true, className }: Props) {
    return (
        <ProfileFields className={className}>
            <ProfileField label="Nombre" value={patient.name} />
            <ProfileField label="DNI" value={patient.dni} />
            <ProfileField label="Fecha de nacimiento" value={patient.birth_date} />
            <ProfileField label="Teléfono" value={patient.phone ?? '—'} />
            <ProfileField label="Correo" value={patient.email || '—'} />
            {showHealthInsurance ? <ProfileField label="Obra social" value={patient.health_insurance ?? 'Particular'} /> : null}
        </ProfileFields>
    );
}
