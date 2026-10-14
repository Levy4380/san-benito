import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import AssociateSpecialtiesForm from '@/Components/Professionals/AssociateSpecialtiesForm';
import Surface from '@/Components/Surfaces/Surface';
import { specialtyNames } from '@/lib/specialties';
import type { ProfessionalRecord, Specialty } from '@/types';

type Props = {
    professional: ProfessionalRecord;
    specialties: Specialty[];
};

export default function ProfessionalSpecialties({ professional, specialties }: Props) {
    return (
        <>
            <Head title={`Especialidades · ${professional.user.name}`} />
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
                        <AssociateSpecialtiesForm professional={professional} specialties={specialties} />
                    </Surface>
                </StageCard>
            </PageScreen>
        </>
    );
}
