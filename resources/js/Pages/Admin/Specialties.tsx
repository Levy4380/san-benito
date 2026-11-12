import CreateNameModal from '@/Components/Admin/CreateNameModal';
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
import { useState } from 'react';

type CatalogSpecialty = {
    id: number;
    name: string;
    professionals_count: number;
};

type Props = {
    specialties: CatalogSpecialty[];
};

export default function AdminSpecialties({ specialties }: Props) {
    const { ask, dialog } = useConfirm();
    const [creating, setCreating] = useState(false);

    const remove = async (specialty: CatalogSpecialty) => {
        const ok = await ask({
            title: 'Eliminar especialidad',
            message:
                specialty.professionals_count > 0
                    ? `¿Eliminar ${specialty.name}? Los profesionales asignados se desvinculan; no se borran.`
                    : `¿Eliminar ${specialty.name}?`,
            confirmLabel: 'Eliminar',
            danger: true,
        });

        if (ok) {
            router.delete(`/specialties/${specialty.id}`);
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
                        backHref="/admin/configuracion"
                        backLabel="Configuración"
                        actions={
                            <Btn type="button" onClick={() => setCreating(true)}>
                                <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Crear especialidad
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
            {creating ? (
                <CreateNameModal
                    title="Crear especialidad"
                    message="Catálogo de especialidades. Solo super admin."
                    submitLabel="Crear especialidad"
                    loadUrl="/admin/configuracion/especialidades/crear"
                    storeUrl="/specialties"
                    onDismiss={() => setCreating(false)}
                />
            ) : null}
        </>
    );
}

function SpecialtyRow({ specialty, onDelete }: { specialty: CatalogSpecialty; onDelete: () => void }) {
    const professionalsLabel = specialty.professionals_count === 1 ? '1 profesional' : `${specialty.professionals_count} profesionales`;

    return (
        <ListRow className="max-md:flex-wrap">
            <strong className="min-w-0 flex-1 truncate">{specialty.name}</strong>
            <span className="text-ink-2 text-sm">{professionalsLabel}</span>
            <Btn size="sm" variant="outline" asChild>
                <Link href={`/admin/configuracion/especialidades/${specialty.id}/editar`}>Editar</Link>
            </Btn>
            <Btn type="button" variant="danger" size="sm" onClick={onDelete}>
                <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Eliminar
            </Btn>
        </ListRow>
    );
}
