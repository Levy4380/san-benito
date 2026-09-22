import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import BookingCard, { BookingCardActions, BookingCardFields, BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import type { AppointmentRecord, DoctorRecord, PatientRecord } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';

type Paginator = {
    data: AppointmentRecord[];
};

type Props = {
    appointments: Paginator;
    filters: { doctor_id: number | null; patient_id: number | null; date: string | null };
    doctors: DoctorRecord[];
    patients: PatientRecord[];
};

export default function AdminAppointments({ appointments, filters, doctors, patients }: Props) {
    return (
        <>
            <Head title="Reservas" />
            <PageScreen header={<PageHeader title="Reservas" description="Todas las reservas de la institución." />}>
                <StageCard>
                    <Results>
                        <Filters
                            className="sm:grid-cols-[1fr_1fr_1fr_auto]"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get('/admin/appointments', Object.fromEntries(data), { preserveState: true });
                            }}
                        >
                            <Field label="Doctor" htmlFor="doctor_id" flush className="min-w-0">
                                <Combobox
                                    id="doctor_id"
                                    name="doctor_id"
                                    defaultValue={filters.doctor_id != null ? String(filters.doctor_id) : ''}
                                    options={[
                                        { value: '', label: 'Todos' },
                                        ...doctors.map((doctor) => ({ value: String(doctor.id), label: doctor.user.name })),
                                    ]}
                                />
                            </Field>
                            <Field label="Paciente" htmlFor="patient_id" flush className="min-w-0">
                                <Combobox
                                    id="patient_id"
                                    name="patient_id"
                                    defaultValue={filters.patient_id != null ? String(filters.patient_id) : ''}
                                    options={[
                                        { value: '', label: 'Todos' },
                                        ...patients.map((patient) => ({ value: String(patient.id), label: patient.user.name })),
                                    ]}
                                />
                            </Field>
                            <Field label="Fecha" htmlFor="date" flush className="min-w-0">
                                <TextInput id="date" name="date" type="date" defaultValue={filters.date ?? ''} />
                            </Field>
                            <Btn type="submit" className="self-end">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar
                            </Btn>
                        </Filters>
                        {appointments.data.length === 0 ? (
                            <Empty>No hay reservas con esos filtros.</Empty>
                        ) : (
                            <BookingList className="mt-0">
                                {appointments.data.map((appointment) => (
                                    <BookingCard key={appointment.id}>
                                        <BookingCardRow>
                                            <BookingCardFields appointment={appointment} />
                                            <BookingCardActions>
                                                <Btn
                                                    type="button"
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => router.delete(`/appointments/${appointment.id}`)}
                                                >
                                                    <X className="size-3 shrink-0" aria-hidden strokeWidth={2} />
                                                    Cancelar
                                                </Btn>
                                            </BookingCardActions>
                                        </BookingCardRow>
                                    </BookingCard>
                                ))}
                            </BookingList>
                        )}
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
