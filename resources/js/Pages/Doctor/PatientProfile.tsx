import { Head, Link } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Surface from '@/Components/Surfaces/Surface';
import type { PatientRecord } from '@/types';

type Props = {
    patient: PatientRecord;
};

export default function PatientProfile({ patient }: Props) {
    return (
        <>
            <Head title={patient.user.name} />
            <PageScreen header={<PageHeader title={patient.user.name} backHref="/my-patients" backLabel="Mis pacientes" />}>
                <StageCard>
                    <Surface>
                        <dl className="m-0 grid w-full gap-[var(--space-sm)]">
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Nombre</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.user.name}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">DNI</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.dni}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Fecha de nacimiento</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.birth_date}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Obra social</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.health_insurance ?? '—'}</dd>
                            </div>
                            <div className="grid gap-[0.2rem]">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Teléfono</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{patient.user.phone ?? '—'}</dd>
                            </div>
                        </dl>
                        <Btn className="mt-auto pt-[var(--space-md)]" asChild>
                            <Link href={`/agenda?patient_id=${patient.id}`}>
                                <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Asignar turno
                            </Link>
                        </Btn>
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
