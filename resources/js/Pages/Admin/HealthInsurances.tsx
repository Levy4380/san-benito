import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Results, { ResultList } from '@/Components/Surfaces/Results';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';

type CatalogHealthInsurance = {
    id: number;
    name: string;
    doctors_count: number;
};

type Props = {
    healthInsurances: CatalogHealthInsurance[];
};

export default function AdminHealthInsurances({ healthInsurances }: Props) {
    const { ask, dialog } = useConfirm();

    const remove = async (healthInsurance: CatalogHealthInsurance) => {
        const ok = await ask({
            title: 'Eliminar obra social',
            message:
                healthInsurance.doctors_count > 0
                    ? `¿Eliminar ${healthInsurance.name}? Los doctores y pacientes asignados se desvinculan; no se borran.`
                    : `¿Eliminar ${healthInsurance.name}?`,
            confirmLabel: 'Eliminar',
            danger: true,
        });

        if (ok) {
            router.delete(`/admin/settings/health-insurances/${healthInsurance.id}`);
        }
    };

    return (
        <>
            <Head title="Obras sociales" />
            <PageScreen
                header={
                    <PageHeader
                        title="Obras sociales"
                        description="Catálogo de obras sociales. Solo super admin."
                        backHref="/admin/settings"
                        backLabel="Configuración"
                        actions={
                            <Btn asChild>
                                <Link href="/admin/settings/health-insurances/create">
                                    <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear obra social
                                </Link>
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Results>
                        {healthInsurances.length === 0 ? (
                            <Empty>Todavía no hay obras sociales.</Empty>
                        ) : (
                            <ResultList>
                                {healthInsurances.map((healthInsurance) => (
                                    <HealthInsuranceRow
                                        key={healthInsurance.id}
                                        healthInsurance={healthInsurance}
                                        onDelete={() => void remove(healthInsurance)}
                                    />
                                ))}
                            </ResultList>
                        )}
                    </Results>
                </StageCard>
            </PageScreen>
            {dialog}
        </>
    );
}

function HealthInsuranceRow({
    healthInsurance,
    onDelete,
}: {
    healthInsurance: CatalogHealthInsurance;
    onDelete: () => void;
}) {
    const doctorsLabel = healthInsurance.doctors_count === 1 ? '1 doctor' : `${healthInsurance.doctors_count} doctores`;

    return (
        <ListRow className="max-md:flex-wrap">
            <strong className="min-w-0 flex-1 truncate">{healthInsurance.name}</strong>
            <span className="text-ink-2 text-sm">{doctorsLabel}</span>
            <Btn size="sm" variant="outline" asChild>
                <Link href={`/admin/settings/health-insurances/${healthInsurance.id}/edit`}>Editar</Link>
            </Btn>
            <Btn type="button" variant="danger" size="sm" onClick={onDelete}>
                <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Eliminar
            </Btn>
        </ListRow>
    );
}
