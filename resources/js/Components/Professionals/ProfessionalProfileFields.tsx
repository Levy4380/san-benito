import { coverageNames, specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord } from '@/types';
import { ReactNode } from 'react';

type Props = {
    professional: ProfessionalRecord;
    specialtyAction?: ReactNode;
    healthInsuranceAction?: ReactNode;
};

export default function ProfessionalProfileFields({ professional, specialtyAction, healthInsuranceAction }: Props) {
    const showCoverages = professional.health_insurances !== undefined;

    return (
        <dl className="m-0 grid w-full gap-[var(--space-sm)]">
            <Field label="Nombre" value={professional.user.name} />
            <Field label="Especialidades" value={specialtyNames(professional.specialties)} action={specialtyAction} />
            {showCoverages ? (
                <Field label="Obras sociales" value={coverageNames(professional.health_insurances)} action={healthInsuranceAction} />
            ) : null}
            <Field label="Matrícula" value={professional.license_number} />
        </dl>
    );
}

function Field({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
    return (
        <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">{label}</dt>
            <dd className="m-0 flex items-center justify-between gap-[0.5rem] text-[length:var(--text-md)] text-ink">
                <span className="min-w-0">{value}</span>
                {action}
            </dd>
        </div>
    );
}
