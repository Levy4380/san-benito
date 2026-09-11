import { Head, Link, useForm } from '@inertiajs/react';
import { LogIn } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import Hint from '@/Components/Surfaces/Hint';
import NativeSelect from '@/Components/Form/NativeSelect';
import TextInput from '@/Components/Form/TextInput';
import AuthLayout from '@/Layouts/auth-layout';

const DEMO_PASSWORD = 'password';

type DemoAccount = {
    role: string;
    name: string;
    email: string;
};

type Props = {
    status?: string;
    canResetPassword: boolean;
    demoAccounts: DemoAccount[];
};

export default function Login({ status, canResetPassword, demoAccounts = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const selectedDemoEmail = demoAccounts.some((account) => account.email === data.email) ? data.email : '';

    const applyDemoAccount = (email: string) => {
        const account = demoAccounts.find((item) => item.email === email);
        if (!account) {
            return;
        }

        setData({
            ...data,
            email: account.email,
            password: DEMO_PASSWORD,
        });
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <AuthLayout title="Ingresá" description="Usá tu correo y contraseña.">
            <Head title="Ingresar" />
            <form onSubmit={submit}>
                <Field label="Correo" htmlFor="email" error={errors.email} flush>
                    <TextInput
                        id="email"
                        type="email"
                        value={data.email}
                        autoComplete="email"
                        autoFocus
                        required
                        onChange={(event) => setData('email', event.target.value)}
                    />
                </Field>
                <Field label="Contraseña" htmlFor="password" error={errors.password} flush>
                    <TextInput
                        id="password"
                        type="password"
                        value={data.password}
                        autoComplete="current-password"
                        required
                        onChange={(event) => setData('password', event.target.value)}
                    />
                </Field>
                <CheckLabel checked={data.remember} onChange={(checked) => setData('remember', checked)}>
                    Recordarme
                </CheckLabel>
                <Btn type="submit" block disabled={processing}>
                    <LogIn className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Ingresar
                </Btn>
                {canResetPassword ? (
                    <Hint>
                        <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
                    </Hint>
                ) : null}
                <Hint>
                    ¿No tenés cuenta? <Link href="/register">Registrate</Link>
                </Hint>
            </form>
            {status ? <Hint>{status}</Hint> : null}
            {demoAccounts.length > 0 ? (
                <div className="mt-[var(--space-2xs)] border-t border-rule pt-[var(--space-sm)]">
                    <Field label="Cuenta de prueba" htmlFor="demo-account" flush>
                        <NativeSelect id="demo-account" value={selectedDemoEmail} onChange={(event) => applyDemoAccount(event.target.value)}>
                            <option value="">Elegí una cuenta</option>
                            {demoAccounts.map((account) => (
                                <option key={account.email} value={account.email}>
                                    {account.role} · {account.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                </div>
            ) : null}
        </AuthLayout>
    );
}
