import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatWallClockTime, wallClockDateKey } from '@/lib/datetime';

type Appointment = {
    id: number;
    starts_at: string;
    status: string;
    doctor: { user: { name: string } };
    patient?: { user: { name: string } } | null;
};

type Option = { id: number; user: { name: string } };

type Props = {
    appointments: {
        data: Appointment[];
    };
    doctors: Option[];
    patients: Option[];
    filters: {
        doctor_id?: string | number | null;
        patient_id?: string | number | null;
        date?: string | null;
    };
};

export default function AdminAppointments({ appointments, doctors, patients, filters }: Props) {
    const [doctorId, setDoctorId] = useState(String(filters.doctor_id ?? ''));
    const [patientId, setPatientId] = useState(String(filters.patient_id ?? ''));
    const [date, setDate] = useState(filters.date ?? '');

    const filter = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.appointments.index'),
            {
                doctor_id: doctorId || undefined,
                patient_id: patientId || undefined,
                date: date || undefined,
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Turnos', href: '/admin/appointments' }]}>
            <Head title="Turnos" />
            <div className="page-shell page-shell--wide">
                <PageHeader title="Todos los turnos" description="Filtrá por doctor, paciente o fecha." />

                <form onSubmit={filter} className="surface grid gap-3 md:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor="doctor_id">Doctor</Label>
                        <select
                            id="doctor_id"
                            className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                            value={doctorId}
                            onChange={(e) => setDoctorId(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="patient_id">Paciente</Label>
                        <select
                            id="patient_id"
                            className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                        <Button type="submit">Filtrar</Button>
                    </div>
                </form>

                <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                    {appointments.data.map((appointment) => (
                        <li key={appointment.id} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
                            <div>
                                <p className="font-display text-[length:var(--text-md)]">
                                    {wallClockDateKey(appointment.starts_at)} ·{' '}
                                    {formatWallClockTime(appointment.starts_at)}
                                </p>
                                <p className="text-[length:var(--text-xs)] font-semibold tracking-wide text-[var(--color-ink-2)] uppercase">
                                    {appointment.status === 'available' ? 'Disponible' : 'Reservado'}
                                </p>
                            </div>
                            <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                Doctor: <span className="text-[var(--color-ink)]">{appointment.doctor.user.name}</span>
                            </p>
                            <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                Paciente:{' '}
                                <span className="text-[var(--color-ink)]">{appointment.patient?.user.name ?? '—'}</span>
                            </p>
                        </li>
                    ))}
                    {appointments.data.length === 0 && (
                        <li className="py-8 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                            No hay turnos para esos filtros.
                        </li>
                    )}
                </ul>
            </div>
        </AppLayout>
    );
}
