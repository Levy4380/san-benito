import { Head, router, useForm } from '@inertiajs/react';
import { LogOut, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Btn } from '@/Components/Form/Btn';
import Hint from '@/Components/Surfaces/Hint';
import AuthLayout from '@/Layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <AuthLayout title="Verificá tu correo" description="Hacé clic en el enlace que te enviamos para verificar tu correo.">
            <Head title="Verificar correo" />

            {status === 'verification-link-sent' ? (
                <Hint>Enviamos un nuevo enlace de verificación a tu correo.</Hint>
            ) : null}

            <form onSubmit={submit}>
                <Btn type="submit" block disabled={processing}>
                    <Mail className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Reenviar correo de verificación
                </Btn>
                <Btn type="button" variant="outline" block onClick={() => router.post('/logout')}>
                    <LogOut className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Cerrar sesión
                </Btn>
            </form>
        </AuthLayout>
    );
}
