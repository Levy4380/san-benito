import { Head, router, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type DemoAccount = {
    label: string;
    email: string;
};

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

type LoginProps = {
    status?: string;
    canResetPassword: boolean;
    demoAccounts?: DemoAccount[];
};

const DEMO_PASSWORD = 'password';

export default function Login({ status, canResetPassword, demoAccounts = [] }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });
    const [selectedDemo, setSelectedDemo] = useState(demoAccounts[0]?.email ?? '');
    const [demoProcessing, setDemoProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const loginAsDemo = () => {
        if (!selectedDemo) {
            return;
        }

        setDemoProcessing(true);
        router.post(
            route('login'),
            {
                email: selectedDemo,
                password: DEMO_PASSWORD,
                remember: false,
            },
            {
                onFinish: () => setDemoProcessing(false),
            },
        );
    };

    return (
        <AuthLayout title="Iniciar sesión" description="Ingresá tu email y contraseña">
            <Head title="Iniciar sesión" />

            {demoAccounts.length > 0 && (
                <div className="mb-6 grid gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4">
                    <p className="font-display text-[length:var(--text-sm)] text-[var(--color-ink)]">Entrar como demo</p>
                    <div className="grid gap-2">
                        <Label htmlFor="demo_account">Cuenta</Label>
                        <select
                            id="demo_account"
                            className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                            value={selectedDemo}
                            onChange={(e) => setSelectedDemo(e.target.value)}
                            disabled={processing || demoProcessing}
                        >
                            {demoAccounts.map((account) => (
                                <option key={account.email} value={account.email}>
                                    {account.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button type="button" variant="secondary" onClick={loginAsDemo} disabled={processing || demoProcessing || !selectedDemo}>
                        {(processing || demoProcessing) && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Iniciar sesión con esta cuenta
                    </Button>
                </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Contraseña</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    ¿Olvidaste tu contraseña?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Contraseña"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Recordarme</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing || demoProcessing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Iniciar sesión
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    ¿No tenés cuenta?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Registrate
                    </TextLink>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
