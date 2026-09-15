import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Results from '@/Components/Surfaces/Results';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

type CatalogSpecialty = {
    id: number;
    name: string;
    doctors_count: number;
};

type Props = {
    specialties: CatalogSpecialty[];
};

export default function AdminSpecialties({ specialties }: Props) {
    const form = useForm({ name: '' });
    const [creating, setCreating] = useState(() => form.hasErrors);
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
                        backHref={creating ? undefined : '/admin/settings'}
                        onBack={creating ? () => setCreating(false) : undefined}
                        backLabel={creating ? 'Especialidades' : 'Configuración'}
                        actions={
                            creating ? undefined : (
                                <Btn type="button" onClick={() => setCreating(true)}>
                                    <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear especialidad
                                </Btn>
                            )
                        }
                    />
                }
            >
                <StageCard>
                    {creating ? (
                        <Results className="gap-[var(--space-md)]">
                            <form
                                className="grid min-h-0 flex-1 content-start overflow-auto"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    form.post('/admin/settings/specialties', {
                                        preserveState: true,
                                        onSuccess: () => {
                                            form.reset();
                                            setCreating(false);
                                        },
                                    });
                                }}
                            >
                                <Field label="Nombre" htmlFor="specialty_name" error={form.errors.name}>
                                    <TextInput
                                        id="specialty_name"
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        required
                                    />
                                </Field>
                                <Btn type="submit" disabled={form.processing}>
                                    <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear especialidad
                                </Btn>
                            </form>
                        </Results>
                    ) : (
                        <Results>
                            {specialties.length === 0 ? (
                                <Empty>Todavía no hay especialidades.</Empty>
                            ) : (
                                <div className="grid min-h-0 flex-1 content-start gap-[0.65rem] overflow-auto">
                                    {specialties.map((specialty) => (
                                        <SpecialtyRow key={specialty.id} specialty={specialty} onDelete={() => void remove(specialty)} />
                                    ))}
                                </div>
                            )}
                        </Results>
                    )}
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
