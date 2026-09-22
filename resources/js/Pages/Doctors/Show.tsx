import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, IdCard, Stethoscope } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import DoctorProfileFields from '@/Components/Doctors/DoctorProfileFields';
import { Btn } from '@/Components/Form/Btn';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import { hasPermission, Permission } from '@/lib/permissions';
import type { DoctorRecord, SharedData } from '@/types';

type Props = {
    doctor: DoctorRecord;
};

export default function DoctorShow({ doctor }: Props) {
    const { auth } = usePage<SharedData>().props;
    const canAssociateSpecialties = hasPermission(auth.user?.permissions, Permission.SpecialtiesManage);
    const canAssociateHealthInsurances = hasPermission(auth.user?.permissions, Permission.HealthInsurancesManage);

    return (
        <>
            <Head title={doctor.user.name} />
            <PageScreen
                header={
                    <PageHeader
                        title={doctor.user.name}
                        description={specialtyNames(doctor.specialties)}
                        backHref="/doctors"
                        backLabel="Doctores"
                        actions={
                            canAssociateSpecialties || canAssociateHealthInsurances ? (
                                <>
                                    {canAssociateSpecialties ? (
                                        <Btn asChild>
                                            <Link href={`/doctors/${doctor.id}/specialties`}>
                                                <Stethoscope className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                Asociar especialidad
                                            </Link>
                                        </Btn>
                                    ) : null}
                                    {canAssociateHealthInsurances ? (
                                        <Btn asChild>
                                            <Link href={`/doctors/${doctor.id}/health-insurances`}>
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
                    <Surface className="gap-[var(--space-md)]">
                        <DoctorProfileFields doctor={doctor} />
                        <Btn asChild>
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
