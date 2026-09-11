import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Hint from '@/Components/Surfaces/Hint';
import Surface from '@/Components/Surfaces/Surface';
import { useForm } from '@inertiajs/react';
import { Trash2, Undo2 } from 'lucide-react';
import { FormEventHandler, useCallback, useRef, useState } from 'react';

export default function DeleteUser() {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const closeModal = useCallback(() => {
        setOpen(false);
        clearErrors();
        reset();
    }, [clearErrors, reset]);

    const deleteUser: FormEventHandler = (event) => {
        event.preventDefault();

        destroy('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <Surface>
            <Hint>Eliminar cuenta. Esta acción no se puede deshacer.</Hint>
            <Btn type="button" variant="danger" onClick={() => setOpen(true)}>
                <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Eliminar cuenta
            </Btn>
            {open ? (
                <ConfirmDialog
                    title="¿Eliminar tu cuenta?"
                    message="Se van a borrar tu cuenta y todos sus datos. Ingresá tu contraseña para confirmar."
                    onDismiss={closeModal}
                >
                    <form className="grid gap-[var(--space-sm)]" onSubmit={deleteUser}>
                        <Field label="Contraseña" htmlFor="delete-password" error={errors.password} flush>
                            <TextInput
                                id="delete-password"
                                ref={passwordInput}
                                type="password"
                                name="password"
                                value={data.password}
                                autoComplete="current-password"
                                autoFocus
                                onChange={(event) => setData('password', event.target.value)}
                            />
                        </Field>
                        <div className="mt-[0.25rem] flex flex-wrap justify-end gap-[0.5rem]">
                            <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={closeModal}>
                                <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Volver
                            </Btn>
                            <Btn type="submit" variant="danger" className="min-w-[6.5rem]" disabled={processing}>
                                <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Eliminar cuenta
                            </Btn>
                        </div>
                    </form>
                </ConfirmDialog>
            ) : null}
        </Surface>
    );
}
