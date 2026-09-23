import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import PatientProfileBtn from '@/Components/Common/PatientProfileBtn';
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
import { Link2, Search, UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Props = {
    patients: PatientRecord[];
    candidates: PatientRecord[];
    filters: { q: string };
};

export default function MyPatients({ patients, candidates, filters }: Props) {
    const hasSearch = filters.q.trim() !== '';
    const linkedIds = new Set(patients.map((patient) => patient.id));
    const toLink = candidates.filter((patient) => !linkedIds.has(patient.id));

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/my-patients', Object.fromEntries(data), { preserveState: true });
    };

    return (
        <>
            <Head title="Mis pacientes" />
            <PageScreen header={<PageHeader title="Mis pacientes" description="Pacientes vinculados a tu agenda." />}>
                <StageCard>
                    <Results>
                        <Filters variant="one" onSubmit={submit}>
                            <Field label="Nombre, DNI o correo" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} />
                            </Field>
                            <Btn type="submit" className="self-end">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar
                            </Btn>
                        </Filters>
                        {toLink.length === 0 && patients.length === 0 ? (
                            <Empty>
                                {hasSearch ? 'No hay pacientes con esos filtros.' : 'Todavía no tenés pacientes vinculados.'}
                            </Empty>
                        ) : (
                            <DoctorGrid>
                                {toLink.map((patient) => (
                                    <DoctorCard key={`link-${patient.id}`} as="div">
                                        <strong>{patient.user.name}</strong>
                                        <span>DNI {patient.dni}</span>
                                        <span>{patient.health_insurance ?? 'Sin obra social'}</span>
                                        <DoctorCardActions>
                                            <Btn
                                                type="button"
                                                size="sm"
                                                onClick={() => router.post('/my-patients', { patient_id: patient.id })}
                                            >
                                                <Link2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                Vincular
                                            </Btn>
                                        </DoctorCardActions>
                                    </DoctorCard>
                                ))}
                                {patients.map((patient) => (
                                    <DoctorCard key={patient.id} as="div">
                                        <strong>{patient.user.name}</strong>
                                        <span>DNI {patient.dni}</span>
                                        <span>{patient.health_insurance ?? 'Sin obra social'}</span>
                                        <DoctorCardActions>
                                            <PatientProfileBtn patientId={patient.id} name={patient.user.name} />
                                            <Btn size="sm" asChild>
                                                <Link href={`/agenda?patient_id=${patient.id}&panel=assign`}>
                                                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Asignar turno
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
