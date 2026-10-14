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

type CatalogProfessional = {
    id: number;
    name: string;
    assigned: boolean;
};

type Props = {
    healthInsurance: { id: number; name: string };
    professionals: CatalogProfessional[];
};

export default function AdminHealthInsuranceEdit({ healthInsurance, professionals }: Props) {
    const form = useForm({
        name: healthInsurance.name,
        professional_ids: professionals.filter((professional) => professional.assigned).map((professional) => professional.id),
    });

    return (
        <>
            <Head title={healthInsurance.name} />
            <PageScreen
                header={
                    <PageHeader
                        title="Obras sociales"
                        description="Nombre y profesionales asociados."
                        backHref="/admin/configuracion/obras-sociales"
                        backLabel="Obras sociales"
                    />
                }
            >
                <StageCard>
                    <Results className="gap-[var(--space-md)]">
                        <form
                            className="grid min-h-0 flex-1 content-start overflow-auto"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.patch(`/health-insurances/${healthInsurance.id}`);
                            }}
                        >
                            <Field label="Nombre" htmlFor="health_insurance_name" error={form.errors.name}>
                                <TextInput
                                    id="health_insurance_name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    required
                                />
                            </Field>
                            <Field label="Profesionales" htmlFor="professional_ids" error={form.errors.professional_ids}>
                                <Combobox
                                    id="professional_ids"
                                    multiple
                                    value={form.data.professional_ids.map(String)}
                                    placeholder="Elegí profesionales"
                                    searchLabel="Buscar profesional"
                                    empty="Todavía no hay profesionales."
                                    emptyFiltered="No hay profesionales con ese nombre."
                                    onChange={(values) => form.setData('professional_ids', values.map(Number))}
                                    options={professionals.map((professional) => ({
                                        value: String(professional.id),
                                        label: professional.name,
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
