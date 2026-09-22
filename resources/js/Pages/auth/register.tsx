import { Head, Link, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import Hint from '@/Components/Surfaces/Hint';
import TextInput from '@/Components/Form/TextInput';
import AuthLayout from '@/Layouts/auth-layout';
import type { HealthInsurance } from '@/types';

type Props = {
    healthInsurances: HealthInsurance[];
};

export default function Register({ healthInsurances }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        dni: '',
        birth_date: '',
        phone: '',
        health_insurance_id: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/register');
    };

    return (
        <AuthLayout title="Crear cuenta" description="El registro público es solo para pacientes.">
            <Head title="Registro" />
            <form onSubmit={submit}>
                <Field label="Nombre" htmlFor="name" error={errors.name} flush>
                    <TextInput id="name" value={data.name} required onChange={(event) => setData('name', event.target.value)} />
                </Field>
                <Field label="Correo" htmlFor="email" error={errors.email} flush>
                    <TextInput id="email" type="email" value={data.email} required onChange={(event) => setData('email', event.target.value)} />
                </Field>
                <Field label="DNI" htmlFor="dni" error={errors.dni} flush>
                    <TextInput id="dni" value={data.dni} required onChange={(event) => setData('dni', event.target.value)} />
                </Field>
                <Field label="Fecha de nacimiento" htmlFor="birth_date" error={errors.birth_date} flush>
                    <TextInput
                        id="birth_date"
                        type="date"
                        value={data.birth_date}
                        required
                        onChange={(event) => setData('birth_date', event.target.value)}
                    />
                </Field>
                <Field label="Teléfono (opcional)" htmlFor="phone" error={errors.phone} flush>
                    <TextInput id="phone" value={data.phone} onChange={(event) => setData('phone', event.target.value)} />
                </Field>
                <Field label="Obra social (opcional)" htmlFor="health_insurance_id" error={errors.health_insurance_id} flush>
                    <NativeSelect
                        id="health_insurance_id"
                        value={data.health_insurance_id}
                        onChange={(event) => setData('health_insurance_id', event.target.value)}
                    >
                        <option value="">Sin obra social</option>
                        {healthInsurances.map((healthInsurance) => (
                            <option key={healthInsurance.id} value={healthInsurance.id}>
                                {healthInsurance.name}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field label="Contraseña" htmlFor="password" error={errors.password} flush>
                    <TextInput id="password" type="password" value={data.password} required onChange={(event) => setData('password', event.target.value)} />
                </Field>
                <Field label="Confirmar contraseña" htmlFor="password_confirmation" error={errors.password_confirmation} flush>
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        required
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                    />
                </Field>
                <Btn type="submit" block disabled={processing}>
                    <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Crear cuenta
                </Btn>
                <Hint>
                    ¿Ya tenés cuenta? <Link href="/login">Ingresá</Link>
                </Hint>
            </form>
        </AuthLayout>
    );
}
