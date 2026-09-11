import { Head, Link, useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import Hint from '@/Components/Surfaces/Hint';
import TextInput from '@/Components/Form/TextInput';
import AuthLayout from '@/Layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/forgot-password');
    };

    return (
        <AuthLayout title="Olvidé mi contraseña" description="Ingresá tu correo para recibir el enlace de restablecimiento.">
            <Head title="Olvidé mi contraseña" />

            {status ? <Hint>{status}</Hint> : null}

            <form onSubmit={submit}>
                <Field label="Correo" htmlFor="email" error={errors.email} flush>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="off"
                        value={data.email}
                        autoFocus
                        onChange={(event) => setData('email', event.target.value)}
                    />
                </Field>
                <Btn type="submit" block disabled={processing}>
                    <Mail className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Enviar enlace
                </Btn>
            </form>
            <Hint>
                ¿Ya tenés cuenta? <Link href="/login">Ingresá</Link>
            </Hint>
        </AuthLayout>
    );
}
