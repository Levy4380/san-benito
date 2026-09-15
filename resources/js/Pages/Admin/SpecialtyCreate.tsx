import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Results from '@/Components/Surfaces/Results';
import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';

export default function AdminSpecialtyCreate() {
    const form = useForm({ name: '' });

    return (
        <>
            <Head title="Crear especialidad" />
            <PageScreen
                header={
                    <PageHeader
                        title="Especialidades"
                        description="Catálogo de especialidades. Solo super admin."
                        backHref="/admin/settings/specialties"
                        backLabel="Especialidades"
                    />
                }
            >
                <StageCard>
                    <Results className="gap-[var(--space-md)]">
                        <form
                            className="grid min-h-0 flex-1 content-start overflow-auto"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post('/admin/settings/specialties');
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
                </StageCard>
            </PageScreen>
        </>
    );
}
