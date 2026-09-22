import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import AssociateHealthInsurancesForm from '@/Components/Doctors/AssociateHealthInsurancesForm';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, HealthInsurance } from '@/types';

type Props = {
    doctor: DoctorRecord & { health_insurances: HealthInsurance[] };
    healthInsurances: HealthInsurance[];
};

export default function DoctorHealthInsurances({ doctor, healthInsurances }: Props) {
    return (
        <>
            <Head title={`Obras sociales · ${doctor.user.name}`} />
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
                        <AssociateHealthInsurancesForm doctor={doctor} healthInsurances={healthInsurances} />
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
