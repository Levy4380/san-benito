import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, IdCard, Stethoscope } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ProfessionalProfileFields from '@/Components/Professionals/ProfessionalProfileFields';
import { Btn } from '@/Components/Form/Btn';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import { hasPermission, Permission } from '@/lib/permissions';
import type { ProfessionalRecord, SharedData } from '@/types';

type Props = {
    professional: ProfessionalRecord;
};

export default function ProfessionalShow({ professional }: Props) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const onAdmin = page.url.split('?')[0].startsWith('/admin/');
    const directory = onAdmin ? '/admin/profesionales' : '/paciente/profesionales';
    const canAssociateSpecialties = hasPermission(auth.user?.permissions, Permission.SpecialtiesManage);
    const canAssociateHealthInsurances = hasPermission(auth.user?.permissions, Permission.HealthInsurancesManage);

    return (
        <>
            <Head title={professional.user.name} />
            <PageScreen
                header={
                    <PageHeader
                        title={professional.user.name}
                        description={specialtyNames(professional.specialties)}
                        backHref={directory}
                        backLabel="Profesionales"
                        actions={
                            canAssociateSpecialties || canAssociateHealthInsurances ? (
                                <>
                                    {canAssociateSpecialties ? (
                                        <Btn asChild>
                                            <Link href={`/admin/profesionales/${professional.id}/especialidades`}>
                                                <Stethoscope className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                Asociar especialidad
                                            </Link>
                                        </Btn>
                                    ) : null}
                                    {canAssociateHealthInsurances ? (
                                        <Btn asChild>
                                            <Link href={`/admin/profesionales/${professional.id}/obras-sociales`}>
                                                <IdCard className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                Asociar obra social
                                            </Link>
                                        </Btn>
                                    ) : null}
                                </>
                            ) : undefined
                        }
                    />
                }
            >
                <StageCard>
                    <Surface className="min-h-0 flex-1 gap-[var(--space-md)] overflow-y-auto">
                        <ProfessionalProfileFields professional={professional} />
                        <Btn className="shrink-0" asChild>
                            <Link href={`${directory}/${professional.id}/horarios`}>
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
