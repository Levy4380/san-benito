import { Btn } from '@/Components/Form/Btn';
import { Check, Trash2, Undo2, X } from 'lucide-react';
import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';

type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (value: boolean) => void };

type ConfirmDialogProps = {
    title: string;
    message: ReactNode;
    children: ReactNode;
    onDismiss: () => void;
};

export function ConfirmDialog({ title, message, children, onDismiss }: ConfirmDialogProps) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onDismiss();
            }
        };

        document.documentElement.classList.add('confirm-open');
        document.addEventListener('keydown', onKey);

        return () => {
            document.documentElement.classList.remove('confirm-open');
            document.removeEventListener('keydown', onKey);
        };
    }, [onDismiss]);

    return (
        <div className="fixed inset-0 z-[200] grid place-items-center p-4" role="presentation">
            <div className="absolute inset-0 bg-[oklch(22%_0.02_255/0.42)]" onClick={onDismiss} />
            <div
                className="relative z-[1] grid w-[min(22rem,100%)] animate-confirm-in gap-[var(--space-sm)] rounded-lg border border-rule bg-paper p-[var(--space-md)] shadow-lg"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-msg"
            >
                <h2 className="m-0 font-display text-[length:var(--text-md)] font-semibold leading-[1.3] text-ink" id="confirm-modal-title">
                    {title}
                </h2>
                <p className="m-0 text-sm leading-[1.45] text-ink-2" id="confirm-modal-msg">
                    {message}
                </p>
                {children}
            </div>
        </div>
    );
}

export function useConfirm() {
    const [pending, setPending] = useState<Pending | null>(null);

    const ask = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setPending({ ...options, resolve });
        });
    }, []);

    const close = useCallback(
        (result: boolean) => {
            pending?.resolve(result);
            setPending(null);
        },
        [pending],
    );

    const dialog: ReactNode = pending ? (
        <ConfirmDialog title={pending.title} message={pending.message} onDismiss={() => close(false)}>
            <div className="mt-[0.25rem] flex flex-wrap justify-end gap-[0.5rem]">
                <Btn type="button" variant="outline" className="min-w-[6.5rem]" autoFocus={pending.danger} onClick={() => close(false)}>
                    <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    {pending.cancelLabel ?? 'Volver'}
                </Btn>
                <Btn
                    type="button"
                    variant={pending.danger ? 'danger' : 'primary'}
                    className="min-w-[6.5rem]"
                    autoFocus={!pending.danger}
                    onClick={() => close(true)}
                >
                    <ConfirmActionIcon label={pending.confirmLabel ?? 'Confirmar'} />
                    {pending.confirmLabel ?? 'Confirmar'}
                </Btn>
            </div>
        </ConfirmDialog>
    ) : null;

    return { ask, dialog };
}

export function prevent(event: FormEvent) {
    event.preventDefault();
}

function ConfirmActionIcon({ label }: { label: string }) {
    if (label === 'Cancelar turno' || label === 'Cancelar') {
        return <X className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />;
    }

    if (label === 'Borrar' || label === 'Borrar franja' || label === 'Eliminar cuenta' || label === 'Eliminar') {
        return <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />;
    }

    return <Check className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />;
}
