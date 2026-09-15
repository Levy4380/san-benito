import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import DoctorCard, { DoctorCardActions, DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import type { PatientRecord } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Info, Search, UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Props = {
    patients: PatientRecord[];
    filters: { name: string; email: string };
};

export default function AdminPatients({ patients, filters }: Props) {
    const hasFilters = filters.name.trim() !== '' || filters.email.trim() !== '';

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
                    <Results>
                        <Filters onSubmit={submitFilters}>
                            <Field label="Nombre" htmlFor="filter_name" flush className="min-w-0">
                                <TextInput id="filter_name" name="name" defaultValue={filters.name} />
                            </Field>
                            <Field label="Correo" htmlFor="filter_email" flush className="min-w-0">
                                <TextInput id="filter_email" name="email" defaultValue={filters.email} />
                            </Field>
                            <Btn type="submit" className="self-end">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar
                            </Btn>
                        </Filters>
                        {patients.length === 0 ? (
                            <Empty>{hasFilters ? 'No hay pacientes con esos filtros.' : 'Todavía no hay pacientes.'}</Empty>
                        ) : (
                            <DoctorGrid>
                                {patients.map((patient) => (
                                    <DoctorCard key={patient.id} as="div">
                                        <strong>{patient.user.name}</strong>
                                        <span>{patient.user.email}</span>
                                        <span>DNI {patient.dni}</span>
                                        <DoctorCardActions>
                                            <Btn size="sm" variant="outline" asChild>
                                                <Link href={`/admin/patients/${patient.id}`}>
                                                    <Info className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Más información
                                                </Link>
                                            </Btn>
                                        </DoctorCardActions>
                                    </DoctorCard>
                                ))}
                            </DoctorGrid>
                        )}
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
