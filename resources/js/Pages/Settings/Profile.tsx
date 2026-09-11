import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { FormEventHandler } from 'react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import DeleteUser from '@/Components/Settings/delete-user';
import UpdatePassword from '@/Components/Settings/update-password';
import Hint from '@/Components/Surfaces/Hint';
import Surface from '@/Components/Surfaces/Surface';
import TextInput from '@/Components/Form/TextInput';
import { type SharedData } from '@/types';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        patch('/settings/profile');
    };

    return (
        <>
            <Head title="Mi perfil" />
            <PageScreen header={<PageHeader title="Mi perfil" description="Nombre, correo y contraseña de tu cuenta." />}>
                <div className="grid gap-[var(--space-md)]">
                    <Surface as="form" onSubmit={submit}>
                        <Field label="Nombre" htmlFor="name" error={errors.name}>
                            <TextInput
                                id="name"
                                value={data.name}
                                required
                                autoComplete="name"
                                onChange={(event) => setData('name', event.target.value)}
                            />
                        </Field>
                        <Field label="Correo" htmlFor="email" error={errors.email}>
                            <TextInput
                                id="email"
                                type="email"
                                value={data.email}
                                required
                                autoComplete="username"
                                onChange={(event) => setData('email', event.target.value)}
                            />
                        </Field>
                        {mustVerifyEmail ? (
                            <Hint>
                                Tu correo no está verificado.{' '}
                                <Link href="/email/verification-notification" method="post" as="button">
                                    Reenviar el correo de verificación.
                                </Link>
                                {status === 'verification-link-sent' ? (
                                    <> Enviamos un nuevo enlace de verificación a tu correo.</>
                                ) : null}
                            </Hint>
                        ) : null}
                        <div className="flex items-center gap-[var(--space-sm)]">
                            <Btn type="submit" disabled={processing}>
                                <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Guardar
                            </Btn>
                            {recentlySuccessful ? <Hint>Guardado.</Hint> : null}
                        </div>
                    </Surface>
                    <UpdatePassword />
                    <DeleteUser />
                </div>
            </PageScreen>
        </>
    );
}
