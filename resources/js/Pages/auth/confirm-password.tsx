import { Head, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import AuthLayout from '@/Layouts/auth-layout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/confirm-password', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Confirmá tu contraseña" description="Esta es una zona segura. Confirmá tu contraseña para continuar.">
            <Head title="Confirmar contraseña" />

            <form onSubmit={submit}>
                <Field label="Contraseña" htmlFor="password" error={errors.password} flush>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        value={data.password}
                        autoFocus
                        onChange={(event) => setData('password', event.target.value)}
                    />
                </Field>
                <Btn type="submit" block disabled={processing}>
                    <Check className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Confirmar
                </Btn>
            </form>
        </AuthLayout>
    );
}
