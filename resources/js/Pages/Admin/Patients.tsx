import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog from '@/Components/Surfaces/Catalog';
import type { PatientRecord } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Props = {
    patients: PatientRecord[];
    filters: { q: string };
};

export default function AdminPatients({ patients, filters }: Props) {
    const hasFilters = filters.q.trim() !== '';

    const submitFilters: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/patients', Object.fromEntries(data), { preserveState: true });
    };

    return (
        <>
            <Head title="Pacientes" />
            <PageScreen
                header={
                    <PageHeader
                        title="Pacientes"
                        description="Alta de pacientes. Solo super admin."
                        actions={
                            <Btn asChild>
                                <Link href="/admin/patients/create">
                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Crear paciente
                                </Link>
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Catalog
                        filterVariant="one"
                        onSearch={submitFilters}
                        empty={hasFilters ? 'No hay pacientes con esos filtros.' : 'Todavía no hay pacientes.'}
                        items={patients.map((patient) => ({
                            key: patient.id,
                            title: patient.user.name,
                            lines: [patient.user.email, `DNI ${patient.dni}`],
                            actions: [{ kind: 'info', href: `/admin/patients/${patient.id}`, name: patient.user.name }],
                        }))}
                    >
                        <Field label="Nombre, DNI o correo" htmlFor="q" flush className="min-w-0">
                            <TextInput id="q" name="q" defaultValue={filters.q} />
                        </Field>
                    </Catalog>
                </StageCard>
            </PageScreen>
        </>
    );
}
