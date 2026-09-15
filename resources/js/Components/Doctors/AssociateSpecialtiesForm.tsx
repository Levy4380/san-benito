import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import SearchableChecks from '@/Components/Form/SearchableChecks';
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

    const toggle = (id: number, checked: boolean) => {
        const current = form.data.specialty_ids;
        form.setData('specialty_ids', checked ? [...current, id] : current.filter((item) => item !== id));
    };

    return (
        <form
            className="grid min-h-0 flex-1 content-start gap-[var(--space-md)] overflow-auto"
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/admin/doctors/${doctor.id}/specialties`);
            }}
        >
            <Field label="Especialidades" error={form.errors.specialty_ids}>
                <SearchableChecks
                    items={specialties}
                    searchId="associate_specialty_search"
                    searchLabel="Buscar especialidad"
                    empty="Todavía no hay especialidades."
                    emptyFiltered="No hay especialidades con ese nombre."
                >
                    {(specialty) => (
                        <CheckLabel
                            checked={form.data.specialty_ids.includes(specialty.id)}
                            onChange={(checked) => toggle(specialty.id, checked)}
                        >
                            {specialty.name}
                        </CheckLabel>
                    )}
                </SearchableChecks>
            </Field>
            <Btn type="submit" disabled={form.processing}>
                <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Guardar
            </Btn>
        </form>
    );
}
