import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord } from '@/types';

export default function ProfessionalProfileFields({ professional }: { professional: ProfessionalRecord }) {
    return (
        <dl className="m-0 grid w-full gap-[var(--space-sm)]">
            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Nombre</dt>
                <dd className="m-0 text-[length:var(--text-md)] text-ink">{professional.user.name}</dd>
            </div>
            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Especialidades</dt>
                <dd className="m-0 text-[length:var(--text-md)] text-ink">{specialtyNames(professional.specialties)}</dd>
            </div>
            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Matrícula</dt>
                <dd className="m-0 text-[length:var(--text-md)] text-ink">{professional.license_number}</dd>
            </div>
        </dl>
    );
}
