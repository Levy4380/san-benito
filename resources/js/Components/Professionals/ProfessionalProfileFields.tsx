import { coverageNames, specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord } from '@/types';
import type { ReactNode } from 'react';
import { ProfileField as Field, ProfileFields } from '@/Components/Common/DetailList';

type Props = {
    professional: ProfessionalRecord;
    specialtyAction?: ReactNode;
    healthInsuranceAction?: ReactNode;
};

export default function ProfessionalProfileFields({ professional, specialtyAction, healthInsuranceAction }: Props) {
    const showCoverages = professional.health_insurances !== undefined;

    return (
        <ProfileFields>
            <Field label="Nombre" value={professional.user.name} />
            <Field label="Especialidades" value={specialtyNames(professional.specialties)} action={specialtyAction} />
            {showCoverages ? (
                <Field label="Obras sociales" value={coverageNames(professional.health_insurances)} action={healthInsuranceAction} />
            ) : null}
            <Field label="Matrícula" value={professional.license_number} />
        </ProfileFields>
    );
}
