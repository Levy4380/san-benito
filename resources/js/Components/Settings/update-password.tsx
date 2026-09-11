import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import Hint from '@/Components/Surfaces/Hint';
import Surface from '@/Components/Surfaces/Surface';
import TextInput from '@/Components/Form/TextInput';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';

export default function UpdatePassword({ heading = true }: { heading?: boolean }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (event) => {
        event.preventDefault();

        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <Surface as="form" onSubmit={updatePassword}>
            {heading ? (
                <>
                    <h2 className="mb-[0.15rem] text-[length:var(--text-md)]">Contraseña</h2>
                    <Hint className="mb-[var(--space-sm)]">Cambiá la contraseña de tu cuenta.</Hint>
                </>
            ) : null}
            <Field label="Contraseña actual" htmlFor="current_password" error={errors.current_password}>
                <TextInput
                    id="current_password"
                    ref={currentPasswordInput}
                    type="password"
                    value={data.current_password}
                    autoComplete="current-password"
                    onChange={(event) => setData('current_password', event.target.value)}
                />
            </Field>
            <Field label="Nueva contraseña" htmlFor="password" error={errors.password}>
                <TextInput
                    id="password"
                    ref={passwordInput}
                    type="password"
                    value={data.password}
                    autoComplete="new-password"
                    onChange={(event) => setData('password', event.target.value)}
                />
            </Field>
            <Field label="Confirmar contraseña" htmlFor="password_confirmation" error={errors.password_confirmation}>
                <TextInput
                    id="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                />
            </Field>
            <div className="flex items-center gap-[var(--space-sm)]">
                <Btn type="submit" disabled={processing}>
                    <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Guardar
                </Btn>
                {recentlySuccessful ? <Hint>Guardado.</Hint> : null}
            </div>
        </Surface>
    );
}
