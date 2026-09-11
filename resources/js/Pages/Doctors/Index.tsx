import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, Search } from 'lucide-react';
import { FormEventHandler } from 'react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import DoctorCard, { DoctorGrid } from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import Field from '@/Components/Form/Field';
import Filters from '@/Components/Surfaces/Filters';
import NativeSelect from '@/Components/Form/NativeSelect';
import Results from '@/Components/Surfaces/Results';
import TextInput from '@/Components/Form/TextInput';
import type { DoctorRecord, Specialty } from '@/types';

type Props = {
    doctors: DoctorRecord[];
    specialties: Specialty[];
    filters: { specialty_id: string; q: string };
};

export default function DoctorsIndex({ doctors, specialties, filters }: Props) {
    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/doctors', Object.fromEntries(form), { preserveState: true });
    };

    return (
        <>
            <Head title="Doctores" />
            <PageScreen header={<PageHeader title="Doctores" description="Buscá por especialidad o nombre." />}>
                <StageCard>
                    <Results>
                        <Filters onSubmit={submit}>
                            <Field label="Especialidad" htmlFor="specialty_id" flush className="min-w-0">
                                <NativeSelect id="specialty_id" name="specialty_id" defaultValue={filters.specialty_id}>
                                    <option value="">Elegí</option>
                                    <option value="all">Todas</option>
                                    {specialties.map((specialty) => (
                                        <option key={specialty.id} value={specialty.id}>
                                            {specialty.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field label="Nombre" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} />
                            </Field>
                            <Btn type="submit" className="self-end">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar
                            </Btn>
                        </Filters>
                        {doctors.length === 0 ? (
                            <Empty>Seleccioná una especialidad o escribí un nombre para ver profesionales.</Empty>
                        ) : (
                            <DoctorGrid>
                                {doctors.map((doctor) => (
                                    <DoctorCard key={doctor.id} asChild>
                                        <Link href={`/doctors/${doctor.id}`}>
                                            <strong>{doctor.user.name}</strong>
                                            <span>{doctor.specialty.name}</span>
                                            <Btn size="sm" asChild>
                                                <span>
                                                    <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Ver turnos
                                                </span>
                                            </Btn>
                                        </Link>
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
