import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import { useForm } from '@inertiajs/react';
import { Plus, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    title: string;
    message: string;
    submitLabel: string;
    loadUrl: string;
    storeUrl: string;
    onDismiss: () => void;
};

export default function CreateNameModal({ title, message, submitLabel, loadUrl, storeUrl, onDismiss }: Props) {
    const form = useForm({ name: '' });
    const [ready, setReady] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const controller = new AbortController();
        setReady(false);
        setLoadFailed(false);

        fetch(loadUrl, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            signal: controller.signal,
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(response)))
            .then(() => setReady(true))
            .catch(() => {
                if (!controller.signal.aborted) {
                    setLoadFailed(true);
                }
            });

        return () => controller.abort();
    }, [loadUrl]);

    return (
        <ConfirmDialog title={title} message={message} onDismiss={onDismiss}>
            <form
                className="grid min-h-0"
                onSubmit={(event) => {
                    event.preventDefault();
                    setErrors({});
                    form.post(storeUrl, {
                        preserveScroll: true,
                        onSuccess: () => onDismiss(),
                        onError: (next) => setErrors(next),
                    });
                }}
            >
                <div className="grid content-start">
                    {loadFailed ? (
                        <Empty>No se pudieron cargar los datos.</Empty>
                    ) : !ready ? (
                        <Hint>Cargando…</Hint>
                    ) : (
                        <Field label="Nombre" htmlFor="create_catalog_name" error={errors.name}>
                            <TextInput
                                id="create_catalog_name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                required
                                autoFocus
                            />
                        </Field>
                    )}
                </div>
                <div className="mt-[0.25rem] flex flex-wrap justify-end gap-[0.5rem]">
                    <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={onDismiss}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                    <Btn type="submit" className="min-w-[6.5rem]" disabled={form.processing || !ready || loadFailed}>
                        <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        {submitLabel}
                    </Btn>
                </div>
            </form>
        </ConfirmDialog>
    );
}
