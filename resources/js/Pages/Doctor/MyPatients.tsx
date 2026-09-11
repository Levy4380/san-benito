import { Head, Link, router, useForm } from '@inertiajs/react';
import { Link2, Search, UserPlus } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import PatientProfileBtn from '@/Components/Common/PatientProfileBtn';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import DoctorCard, { DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Field from '@/Components/Form/Field';
import Filters from '@/Components/Surfaces/Filters';
import ListRow from '@/Components/Surfaces/ListRow';
import TextInput from '@/Components/Form/TextInput';
import type { PatientRecord } from '@/types';

type Props = {
    patients: PatientRecord[];
    candidates: PatientRecord[];
    filters: { q: string };
};

export default function MyPatients({ patients, candidates, filters }: Props) {
    const search = useForm({ q: filters.q });
    const link = useForm({ patient_id: 0 });

    return (
        <>
            <Head title="Mis pacientes" />
            <PageScreen header={<PageHeader title="Mis pacientes" description="Pacientes vinculados a tu agenda." />}>
                <StageCard>
                    <Filters
                        variant="one"
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get('/my-patients', { q: search.data.q }, { preserveState: true });
                        }}
                    >
                        <Field label="Buscar para vincular" htmlFor="q" flush className="min-w-0">
                            <TextInput id="q" value={search.data.q} minLength={2} onChange={(event) => search.setData('q', event.target.value)} />
                        </Field>
                        <Btn type="submit" className="self-end">
                            <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Buscar
                        </Btn>
                    </Filters>
                    {candidates.length > 0 ? (
                        <div>
                            {candidates.map((patient) => (
                                <ListRow key={patient.id}>
                                    <span>
                                        {patient.user.name} · DNI {patient.dni}
                                    </span>
                                    <Btn
                                        type="button"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => {
                                            link.setData('patient_id', patient.id);
                                            link.post('/my-patients');
                                        }}
                                    >
                                        <Link2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Vincular
                                    </Btn>
                                </ListRow>
                            ))}
                        </div>
                    ) : null}
                    {patients.length === 0 ? (
                        <Empty>Todavía no tenés pacientes vinculados.</Empty>
                    ) : (
                        <DoctorGrid>
                            {patients.map((patient) => (
                                <DoctorCard key={patient.id} as="div">
                                    <Link href={`/my-patients/${patient.id}`} className="grid min-w-0 gap-[0.2rem] text-inherit no-underline">
                                        <strong>{patient.user.name}</strong>
                                        <span>DNI {patient.dni}</span>
                                        <span>{patient.health_insurance ?? 'Sin obra social'}</span>
                                    </Link>
                                    <div className="mt-auto flex flex-wrap gap-[0.35rem]">
                                        <PatientProfileBtn patientId={patient.id} name={patient.user.name} />
                                        <Btn size="sm" asChild>
                                            <Link href={`/agenda?patient_id=${patient.id}`}>
                                                <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                Asignar turno
                                            </Link>
                                        </Btn>
                                    </div>
                                </DoctorCard>
                            ))}
                        </DoctorGrid>
                    )}
                </StageCard>
            </PageScreen>
        </>
    );
}
