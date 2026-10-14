import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import AssociateHealthInsurancesForm from '@/Components/Professionals/AssociateHealthInsurancesForm';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord, HealthInsurance } from '@/types';

type Props = {
    professional: ProfessionalRecord & { health_insurances: HealthInsurance[] };
    healthInsurances: HealthInsurance[];
};

export default function ProfessionalHealthInsurances({ professional, healthInsurances }: Props) {
    return (
        <>
            <Head title={`Obras sociales · ${professional.user.name}`} />
            <PageScreen
                header={
                    <PageHeader
                        title={professional.user.name}
                        description={specialtyNames(professional.specialties)}
                        backHref={`/admin/profesionales/${professional.id}`}
                        backLabel={professional.user.name}
                    />
                }
            >
                <StageCard>
                    <Surface>
                        <AssociateHealthInsurancesForm professional={professional} healthInsurances={healthInsurances} />
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
