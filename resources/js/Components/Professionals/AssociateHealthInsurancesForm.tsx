import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import type { ProfessionalRecord, HealthInsurance } from '@/types';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

type Props = {
    professional: ProfessionalRecord & { health_insurances: HealthInsurance[] };
    healthInsurances: HealthInsurance[];
};

export default function AssociateHealthInsurancesForm({ professional, healthInsurances }: Props) {
    const form = useForm({
        health_insurance_ids: professional.health_insurances.map((healthInsurance) => healthInsurance.id),
    });

    return (
        <form
            className="grid min-h-0 flex-1 content-start gap-[var(--space-md)] overflow-auto"
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/admin/profesionales/${professional.id}/obras-sociales`);
            }}
        >
            <Field label="Obras sociales" htmlFor="health_insurance_ids" error={form.errors.health_insurance_ids}>
                <Combobox
                    id="health_insurance_ids"
                    multiple
                    value={form.data.health_insurance_ids.map(String)}
                    placeholder="Elegí obras sociales"
                    searchLabel="Buscar obra social"
                    empty="Todavía no hay obras sociales."
                    emptyFiltered="No hay obras sociales con ese nombre."
                    onChange={(values) => form.setData('health_insurance_ids', values.map(Number))}
                    options={healthInsurances.map((healthInsurance) => ({
                        value: String(healthInsurance.id),
                        label: healthInsurance.name,
                    }))}
                />
            </Field>
            <Btn type="submit" disabled={form.processing}>
                <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Guardar
            </Btn>
        </form>
    );
}
