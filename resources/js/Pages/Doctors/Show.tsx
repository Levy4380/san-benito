import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import AssociateSpecialtiesForm from '@/Components/Doctors/AssociateSpecialtiesForm';
import DoctorProfileFields from '@/Components/Doctors/DoctorProfileFields';
import { Btn } from '@/Components/Form/Btn';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, SharedData, Specialty } from '@/types';

type Props = {
    doctor: DoctorRecord;
    specialties?: Specialty[];
};

export default function DoctorShow({ doctor, specialties = [] }: Props) {
    const { auth, errors } = usePage<SharedData>().props;
    const canAssociate = Boolean(auth.user?.permissions.includes('specialties.manage'));
    const [associating, setAssociating] = useState(() => Boolean(errors?.specialty_ids) && canAssociate);

    return (
        <>
            <Head title={doctor.user.name} />
            <PageScreen
                header={
                    <PageHeader
                        title={doctor.user.name}
                        description={specialtyNames(doctor.specialties)}
                        backHref={associating ? undefined : '/doctors'}
                        onBack={associating ? () => setAssociating(false) : undefined}
                        backLabel={associating ? doctor.user.name : 'Doctores'}
                        actions={
                            canAssociate && !associating ? (
                                <Btn type="button" onClick={() => setAssociating(true)}>
                                    <Stethoscope className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Asociar especialidad
                                </Btn>
                            ) : undefined
                        }
                    />
                }
            >
                <StageCard>
                    <Surface>
                        {associating ? (
                            <AssociateSpecialtiesForm doctor={doctor} specialties={specialties} />
                        ) : (
                            <>
                                <DoctorProfileFields doctor={doctor} />
                                <Btn className="mt-auto pt-[var(--space-md)]" asChild>
                                    <Link href={`/doctors/${doctor.id}/slots`}>
                                        <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Ver turnos
                                    </Link>
                                </Btn>
                            </>
                        )}
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
