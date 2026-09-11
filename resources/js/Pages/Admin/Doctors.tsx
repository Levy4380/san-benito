import { Head, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import ListRow from '@/Components/Surfaces/ListRow';
import NativeSelect from '@/Components/Form/NativeSelect';
import Surface from '@/Components/Surfaces/Surface';
import TextInput from '@/Components/Form/TextInput';
import type { DoctorRecord, Specialty } from '@/types';

type Props = {
    doctors: DoctorRecord[];
    specialties: Specialty[];
};

export default function AdminDoctors({ doctors, specialties }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        license_number: '',
        specialty_id: specialties[0]?.id ?? 0,
        phone: '',
    });

    return (
        <>
            <Head title="Doctores" />
            <PageScreen header={<PageHeader title="Doctores" description="Alta de profesionales." />}>
                <Surface
                    as="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/admin/doctors');
                    }}
                >
                    <Field label="Nombre" htmlFor="name">
                        <TextInput id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
                    </Field>
                    <Field label="Correo" htmlFor="email">
                        <TextInput id="email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} required />
                    </Field>
                    <Field label="Contraseña" htmlFor="password">
                        <TextInput
                            id="password"
                            type="password"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Matrícula" htmlFor="license_number">
                        <TextInput
                            id="license_number"
                            value={form.data.license_number}
                            onChange={(event) => form.setData('license_number', event.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Especialidad" htmlFor="specialty_id">
                        <NativeSelect
                            id="specialty_id"
                            value={form.data.specialty_id}
                            onChange={(event) => form.setData('specialty_id', Number(event.target.value))}
                        >
                            {specialties.map((specialty) => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Btn type="submit" disabled={form.processing}>
                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Crear doctor
                    </Btn>
                </Surface>
                <StageCard className="mt-4">
                    {doctors.map((doctor) => (
                        <ListRow key={doctor.id}>
                            <strong>{doctor.user.name}</strong>
                            <span>{doctor.specialty.name}</span>
                            <span>{doctor.license_number}</span>
                        </ListRow>
                    ))}
                </StageCard>
            </PageScreen>
        </>
    );
}
