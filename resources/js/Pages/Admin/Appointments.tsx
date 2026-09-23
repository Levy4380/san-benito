import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import BookingCard, { BookingCardActions, BookingCardFields, BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters, { type FilterValues } from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import type { AppointmentRecord, DoctorRecord, PatientRecord, Specialty } from '@/types';
import { Head, router } from '@inertiajs/react';
import { X } from 'lucide-react';

type Paginator = {
    data: AppointmentRecord[];
};

type Props = {
    appointments: Paginator;
    filters: { doctor_id: number | null; patient_id: number | null; specialty_id: number | null; date: string | null };
    doctors: DoctorRecord[];
    patients: PatientRecord[];
    specialties: Specialty[];
};

export default function AdminAppointments({ appointments, filters, doctors, patients, specialties }: Props) {
    const apply = (data: FilterValues) => {
        router.get('/admin/appointments', data, { preserveState: true });
    };

    return (
        <>
            <Head title="Reservas" />
            <PageScreen header={<PageHeader title="Reservas" description="Todas las reservas de la institución." />}>
                <StageCard>
                    <Results>
                        <Filters
                            applied={{
                                doctor_id: filters.doctor_id != null ? String(filters.doctor_id) : '',
                                patient_id: filters.patient_id != null ? String(filters.patient_id) : '',
                                specialty_id: filters.specialty_id != null ? String(filters.specialty_id) : 'all',
                            }}
                            onApply={apply}
                            primary={
                                <Field label="Fecha" htmlFor="date" flush className="min-w-0">
                                    <TextInput id="date" name="date" type="date" defaultValue={filters.date ?? ''} />
                                </Field>
                            }
                            advanced={
                                <>
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
                                    <Field label="Especialidad" htmlFor="specialty_id" flush className="min-w-0">
                                        <Combobox
                                            id="specialty_id"
                                            name="specialty_id"
                                            defaultValue={filters.specialty_id != null ? String(filters.specialty_id) : 'all'}
                                            options={[
                                                { value: 'all', label: 'Todas' },
                                                ...specialties.map((specialty) => ({
                                                    value: String(specialty.id),
                                                    label: specialty.name,
                                                })),
                                            ]}
                                        />
                                    </Field>
                                </>
                            }
                        >
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
                        </Filters>
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
