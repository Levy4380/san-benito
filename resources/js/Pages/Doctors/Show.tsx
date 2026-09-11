import { Head, Link } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Surface from '@/Components/Surfaces/Surface';
import type { DoctorRecord } from '@/types';

type Props = {
    doctor: DoctorRecord;
};

export default function DoctorShow({ doctor }: Props) {
    return (
        <>
            <Head title={doctor.user.name} />
            <PageScreen
                header={
                    <PageHeader
                        title={doctor.user.name}
                        description={doctor.specialty.name}
                        backHref="/doctors"
                        backLabel="Doctores"
                    />
                }
            >
                <StageCard>
                    <Surface>
                        <dl className="m-0 grid w-full gap-[var(--space-sm)]">
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Nombre</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{doctor.user.name}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Especialidad</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{doctor.specialty.name}</dd>
                            </div>
                            <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
                                <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">Matrícula</dt>
                                <dd className="m-0 text-[length:var(--text-md)] text-ink">{doctor.license_number}</dd>
                            </div>
                        </dl>
                        <Btn className="mt-auto pt-[var(--space-md)]" asChild>
                            <Link href={`/doctors/${doctor.id}/slots`}>
                                <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Ver turnos
                            </Link>
                        </Btn>
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
