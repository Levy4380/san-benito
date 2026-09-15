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

type CatalogSpecialty = {
    id: number;
    name: string;
    doctors_count: number;
};

type Props = {
    specialties: CatalogSpecialty[];
};

export default function AdminSpecialties({ specialties }: Props) {
    const { ask, dialog } = useConfirm();

    const remove = async (specialty: CatalogSpecialty) => {
        const ok = await ask({
            title: 'Eliminar especialidad',
            message:
                specialty.doctors_count > 0
                    ? `¿Eliminar ${specialty.name}? Los doctores asignados se desvinculan; no se borran.`
                    : `¿Eliminar ${specialty.name}?`,
            confirmLabel: 'Eliminar',
            danger: true,
        });

        if (ok) {
            router.delete(`/admin/settings/specialties/${specialty.id}`);
        }
    };

    return (
        <>
            <Head title="Especialidades" />
            <PageScreen
                header={
                    <PageHeader
                        title="Especialidades"
                        description="Catálogo de especialidades. Solo super admin."
                        backHref="/admin/settings"
                        backLabel="Configuración"
                        actions={
                            <Btn asChild>
                                <Link href="/admin/settings/specialties/create">
                                    <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear especialidad
                                </Link>
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Results>
                        {specialties.length === 0 ? (
                            <Empty>Todavía no hay especialidades.</Empty>
                        ) : (
                            <ResultList>
                                {specialties.map((specialty) => (
                                    <SpecialtyRow key={specialty.id} specialty={specialty} onDelete={() => void remove(specialty)} />
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

function SpecialtyRow({ specialty, onDelete }: { specialty: CatalogSpecialty; onDelete: () => void }) {
    const doctorsLabel = specialty.doctors_count === 1 ? '1 doctor' : `${specialty.doctors_count} doctores`;

    return (
        <ListRow className="max-md:flex-wrap">
            <strong className="min-w-0 flex-1 truncate">{specialty.name}</strong>
            <span className="text-ink-2 text-sm">{doctorsLabel}</span>
            <Btn size="sm" variant="outline" asChild>
                <Link href={`/admin/settings/specialties/${specialty.id}/edit`}>Editar</Link>
            </Btn>
            <Btn type="button" variant="danger" size="sm" onClick={onDelete}>
                <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Eliminar
            </Btn>
        </ListRow>
    );
}
