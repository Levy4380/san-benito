import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import AssociateSpecialtiesForm from '@/Components/Doctors/AssociateSpecialtiesForm';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, Specialty } from '@/types';

type Props = {
    doctor: DoctorRecord;
    specialties: Specialty[];
};

export default function DoctorSpecialties({ doctor, specialties }: Props) {
    return (
        <>
            <Head title={`Especialidades · ${doctor.user.name}`} />
            <PageScreen
                header={
                    <PageHeader
                        title={doctor.user.name}
                        description={specialtyNames(doctor.specialties)}
                        backHref={`/doctors/${doctor.id}`}
                        backLabel={doctor.user.name}
                    />
                }
            >
                <StageCard>
                    <Surface>
                        <AssociateSpecialtiesForm doctor={doctor} specialties={specialties} />
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
