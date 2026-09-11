import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import AuthLayout from '@/Layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

interface ResetPasswordForm {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Nueva contraseña" description="Ingresá tu nueva contraseña.">
            <Head title="Nueva contraseña" />

            <form onSubmit={submit}>
                <Field label="Correo" htmlFor="email" error={errors.email} flush>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={data.email}
                        readOnly
                        onChange={(event) => setData('email', event.target.value)}
                    />
                </Field>
                <Field label="Contraseña" htmlFor="password" error={errors.password} flush>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        value={data.password}
                        autoFocus
                        onChange={(event) => setData('password', event.target.value)}
                    />
                </Field>
                <Field label="Confirmar contraseña" htmlFor="password_confirmation" error={errors.password_confirmation} flush>
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                    />
                </Field>
                <Btn type="submit" block disabled={processing}>
                    <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Guardar contraseña
                </Btn>
            </form>
        </AuthLayout>
    );
}
