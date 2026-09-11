import { Head, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import { Btn } from '@/Components/Form/Btn';
import BookingCard, { BookingCardActions, BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import Field from '@/Components/Form/Field';
import Filters from '@/Components/Surfaces/Filters';
import NativeSelect from '@/Components/Form/NativeSelect';
import TextInput from '@/Components/Form/TextInput';
import { wallDate, wallTime } from '@/lib/datetime';
import type { AppointmentRecord, DoctorRecord, PatientRecord } from '@/types';

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
                <Filters
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        router.get('/admin/appointments', Object.fromEntries(data), { preserveState: true });
                    }}
                >
                    <Field label="Doctor" htmlFor="doctor_id" flush className="min-w-0">
                        <NativeSelect id="doctor_id" name="doctor_id" defaultValue={filters.doctor_id ?? ''}>
                            <option value="">Todos</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.user.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field label="Paciente" htmlFor="patient_id" flush className="min-w-0">
                        <NativeSelect id="patient_id" name="patient_id" defaultValue={filters.patient_id ?? ''}>
                            <option value="">Todos</option>
                            {patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.user.name}
                                </option>
                            ))}
                        </NativeSelect>
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
                    <BookingList className="flex-none overflow-visible">
                        {appointments.data.map((appointment) => (
                            <BookingCard key={appointment.id}>
                                <strong>
                                    {wallDate(appointment.starts_at)} · {wallTime(appointment.starts_at)} · {appointment.doctor?.user.name}
                                </strong>
                                <BookingCardRow>
                                    <span className="min-w-0 truncate text-sm">{appointment.patient?.user.name}</span>
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
            </PageScreen>
        </>
    );
}
