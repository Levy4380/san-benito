import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Time24Input } from '@/components/time-24-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type Specialty = { id: number; name: string };
type Doctor = {
    id: number;
    license_number: string;
    user: { name: string; email: string };
    specialty: { name: string };
};
type PatientOption = {
    id: number;
    dni: string;
    user: { name: string };
};

type Props = {
    doctors: Doctor[];
    specialties: Specialty[];
    patients: PatientOption[];
};

export default function AdminDoctors({ doctors, specialties, patients }: Props) {
    const doctorForm = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        specialty_id: '',
        license_number: '',
    });

    const [slotDoctorId, setSlotDoctorId] = useState('');
    const [slotDate, setSlotDate] = useState('');
    const [slotStartTime, setSlotStartTime] = useState('');
    const [slotEndTime, setSlotEndTime] = useState('');
    const slotForm = useForm({
        starts_at: '',
        ends_at: '',
    });

    const [linkDoctorId, setLinkDoctorId] = useState('');
    const linkForm = useForm({
        patient_id: '',
    });

    const createDoctor = (e: FormEvent) => {
        e.preventDefault();
        doctorForm.post(route('admin.doctors.store'), {
            onSuccess: () => doctorForm.reset(),
        });
    };

    const createSlot = (e: FormEvent) => {
        e.preventDefault();
        if (!slotDoctorId || !slotDate || !slotStartTime || !slotEndTime) {
            return;
        }

        const startsAt = `${slotDate} ${slotStartTime}:00`;
        const endsAt = `${slotDate} ${slotEndTime}:00`;

        slotForm
            .transform(() => ({
                starts_at: startsAt,
                ends_at: endsAt,
            }))
            .post(route('admin.doctors.slots.store', slotDoctorId), {
                onSuccess: () => {
                    slotForm.reset();
                    setSlotDoctorId('');
                    setSlotDate('');
                    setSlotStartTime('');
                    setSlotEndTime('');
                },
                onFinish: () => {
                    slotForm.transform((data) => data);
                },
            });
    };

    const linkPatient = (e: FormEvent) => {
        e.preventDefault();
        if (!linkDoctorId) {
            return;
        }
        linkForm.post(route('admin.doctors.patients.store', linkDoctorId), {
            onSuccess: () => {
                linkForm.reset();
                setLinkDoctorId('');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Doctores', href: '/admin/doctors' }]}>
            <Head title="Doctores" />
            <div className="page-shell page-shell--wide">
                <PageHeader title="Doctores" description="Altas y carga de horarios para la institución." />

                <section className="surface">
                    <h2 className="font-display text-[length:var(--text-lg)]">Alta de doctor</h2>
                    <form onSubmit={createDoctor} className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={doctorForm.data.name}
                                onChange={(e) => doctorForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={doctorForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={doctorForm.data.email}
                                onChange={(e) => doctorForm.setData('email', e.target.value)}
                                required
                            />
                            <InputError message={doctorForm.errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={doctorForm.data.password}
                                onChange={(e) => doctorForm.setData('password', e.target.value)}
                                required
                            />
                            <InputError message={doctorForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="license_number">Matrícula</Label>
                            <Input
                                id="license_number"
                                value={doctorForm.data.license_number}
                                onChange={(e) => doctorForm.setData('license_number', e.target.value)}
                                required
                            />
                            <InputError message={doctorForm.errors.license_number} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="specialty_id">Especialidad</Label>
                            <select
                                id="specialty_id"
                                className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                                value={doctorForm.data.specialty_id}
                                onChange={(e) => doctorForm.setData('specialty_id', e.target.value)}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {specialties.map((specialty) => (
                                    <option key={specialty.id} value={specialty.id}>
                                        {specialty.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={doctorForm.errors.specialty_id} />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={doctorForm.processing}>
                                Crear doctor
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="surface">
                    <h2 className="font-display text-[length:var(--text-lg)]">Cargar horario</h2>
                    <form onSubmit={createSlot} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                        <div className="grid gap-2">
                            <Label htmlFor="doctor_id_for_slot">Doctor</Label>
                            <select
                                id="doctor_id_for_slot"
                                className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                                value={slotDoctorId}
                                onChange={(e) => setSlotDoctorId(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slot_date">Fecha</Label>
                            <Input
                                id="slot_date"
                                type="date"
                                value={slotDate}
                                onChange={(e) => setSlotDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slot_start_time">Inicio</Label>
                            <Time24Input
                                id="slot_start_time"
                                value={slotStartTime}
                                onChange={setSlotStartTime}
                                required
                            />
                            <InputError message={slotForm.errors.starts_at} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slot_end_time">Fin</Label>
                            <Time24Input
                                id="slot_end_time"
                                value={slotEndTime}
                                onChange={setSlotEndTime}
                                required
                            />
                            <InputError message={slotForm.errors.ends_at} />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={slotForm.processing}>
                                Crear horario
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="surface">
                    <h2 className="font-display text-[length:var(--text-lg)]">Vincular paciente</h2>
                    <form onSubmit={linkPatient} className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="doctor_id_for_link">Doctor</Label>
                            <select
                                id="doctor_id_for_link"
                                className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                                value={linkDoctorId}
                                onChange={(e) => setLinkDoctorId(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="patient_id_for_link">Paciente</Label>
                            <select
                                id="patient_id_for_link"
                                className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                                value={linkForm.data.patient_id}
                                onChange={(e) => linkForm.setData('patient_id', e.target.value)}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.user.name} · DNI {patient.dni}
                                    </option>
                                ))}
                            </select>
                            <InputError message={linkForm.errors.patient_id} />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={linkForm.processing}>
                                Vincular
                            </Button>
                        </div>
                    </form>
                </section>

                <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                    {doctors.map((doctor) => (
                        <li key={doctor.id} className="py-4">
                            <p className="font-display text-[length:var(--text-md)]">{doctor.user.name}</p>
                            <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                {doctor.specialty.name} · {doctor.license_number} · {doctor.user.email}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </AppLayout>
    );
}
