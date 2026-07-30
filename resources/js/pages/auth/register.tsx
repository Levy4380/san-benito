import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    dni: string;
    birth_date: string;
    health_insurance: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        dni: '',
        birth_date: '',
        health_insurance: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Crear cuenta de paciente" description="Completá tus datos para registrarte">
            <Head title="Registro" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input
                            id="dni"
                            type="text"
                            required
                            value={data.dni}
                            onChange={(e) => setData('dni', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.dni} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            required
                            value={data.birth_date}
                            onChange={(e) => setData('birth_date', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.birth_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono (opcional)</Label>
                        <Input
                            id="phone"
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="health_insurance">Obra social (opcional)</Label>
                        <Input
                            id="health_insurance"
                            type="text"
                            value={data.health_insurance}
                            onChange={(e) => setData('health_insurance', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.health_insurance} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button type="submit" className="mt-2 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Crear cuenta
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    ¿Ya tenés cuenta?{' '}
                    <TextLink href={route('login')}>Iniciar sesión</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
