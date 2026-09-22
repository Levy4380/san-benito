import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Results from '@/Components/Surfaces/Results';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

type CatalogDoctor = {
    id: number;
    name: string;
    assigned: boolean;
};

type Props = {
    specialty: { id: number; name: string };
    doctors: CatalogDoctor[];
};

export default function AdminSpecialtyEdit({ specialty, doctors }: Props) {
    const form = useForm({
        name: specialty.name,
        doctor_ids: doctors.filter((doctor) => doctor.assigned).map((doctor) => doctor.id),
    });

    return (
        <>
            <Head title={specialty.name} />
            <PageScreen
                header={
                    <PageHeader
                        title="Especialidades"
                        description="Nombre y doctores asociados."
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
                                form.patch(`/admin/settings/specialties/${specialty.id}`);
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
                            <Field label="Doctores" htmlFor="doctor_ids" error={form.errors.doctor_ids}>
                                <Combobox
                                    id="doctor_ids"
                                    multiple
                                    value={form.data.doctor_ids.map(String)}
                                    placeholder="Elegí doctores"
                                    searchLabel="Buscar doctor"
                                    empty="Todavía no hay doctores."
                                    emptyFiltered="No hay doctores con ese nombre."
                                    onChange={(values) => form.setData('doctor_ids', values.map(Number))}
                                    options={doctors.map((doctor) => ({
                                        value: String(doctor.id),
                                        label: doctor.name,
                                    }))}
                                />
                            </Field>
                            <Btn type="submit" disabled={form.processing}>
                                <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Guardar
                            </Btn>
                        </form>
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
