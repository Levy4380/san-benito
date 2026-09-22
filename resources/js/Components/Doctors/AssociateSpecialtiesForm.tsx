import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import type { DoctorRecord, Specialty } from '@/types';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

type Props = {
    doctor: DoctorRecord;
    specialties: Specialty[];
};

export default function AssociateSpecialtiesForm({ doctor, specialties }: Props) {
    const form = useForm({
        specialty_ids: doctor.specialties.map((specialty) => specialty.id),
    });

    return (
        <form
            className="grid min-h-0 flex-1 content-start gap-[var(--space-md)] overflow-auto"
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/admin/doctors/${doctor.id}/specialties`);
            }}
        >
            <Field label="Especialidades" htmlFor="specialty_ids" error={form.errors.specialty_ids}>
                <Combobox
                    id="specialty_ids"
                    multiple
                    value={form.data.specialty_ids.map(String)}
                    placeholder="Elegí especialidades"
                    searchLabel="Buscar especialidad"
                    empty="Todavía no hay especialidades."
                    emptyFiltered="No hay especialidades con ese nombre."
                    onChange={(values) => form.setData('specialty_ids', values.map(Number))}
                    options={specialties.map((specialty) => ({
                        value: String(specialty.id),
                        label: specialty.name,
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
