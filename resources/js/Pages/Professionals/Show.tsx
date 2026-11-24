import { Head, Link } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ProfessionalProfileFields from '@/Components/Professionals/ProfessionalProfileFields';
import { Btn } from '@/Components/Form/Btn';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord } from '@/types';

type Props = {
    professional: ProfessionalRecord;
};

export default function ProfessionalShow({ professional }: Props) {
    return (
        <>
            <Head title={professional.user.name} />
            <PageScreen
                header={
                    <PageHeader
                        title={professional.user.name}
                        description={specialtyNames(professional.specialties)}
                        backHref="/paciente/profesionales"
                        backLabel="Profesionales"
                    />
                }
            >
                <StageCard>
                    <Surface className="min-h-0 flex-1 gap-[var(--space-md)] overflow-y-auto">
                        <ProfessionalProfileFields professional={professional} />
                        <Btn className="shrink-0" asChild>
                            <Link href={`/paciente/profesionales/${professional.id}/horarios`}>
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
