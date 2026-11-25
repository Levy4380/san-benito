import { Btn } from '@/Components/Form/Btn';
import { cn } from '@/lib/utils';
import { Check, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';

type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (value: boolean) => void };

/** confirm: prompt + cancel/accept. info: entity or a short form. workspace: dense content (agenda, sobreturno). */
export type ModalKind = 'confirm' | 'info' | 'workspace';

type ConfirmDialogProps = {
    title: string;
    message?: ReactNode;
    messageClassName?: string;
    headerAction?: ReactNode;
    children: ReactNode;
    onDismiss: () => void;
    className?: string;
    kind?: ModalKind;
    /** Initial focus on «Cerrar» (destructive confirms: Enter must not confirm). */
    focusClose?: boolean;
};

/** Always inset from the viewport: centered, never flush to the edge, never 100vw. */
const kindClass: Record<ModalKind, string> = {
    confirm: 'grid w-[min(26rem,calc(100vw-3rem))] max-h-[calc(100dvh-3rem)] overflow-y-auto',
    info: 'grid w-[min(40rem,calc(100vw-3rem))] max-h-[calc(100dvh-3rem)] overflow-y-auto',
    workspace:
        'flex h-[min(42rem,calc(100dvh-3rem))] w-[min(72rem,calc(100vw-3rem))] max-h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden',
};

/** Open dialogs, innermost last: only the top one reacts to Escape. */
const openDialogs: symbol[] = [];

export function ConfirmDialog({
    title,
    message,
    messageClassName,
    headerAction,
    children,
    onDismiss,
    className,
    kind = 'confirm',
    focusClose = false,
}: ConfirmDialogProps) {
    const dismissRef = useRef(onDismiss);
    const titleId = useId();
    const messageId = useId();

    useEffect(() => {
        dismissRef.current = onDismiss;
    });

    useEffect(() => {
        const id = Symbol('dialog');
        openDialogs.push(id);

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && openDialogs[openDialogs.length - 1] === id) {
                event.preventDefault();
                dismissRef.current();
            }
        };

        document.documentElement.classList.add('confirm-open');
        document.addEventListener('keydown', onKey);

        return () => {
            openDialogs.splice(openDialogs.indexOf(id), 1);
            if (openDialogs.length === 0) {
                document.documentElement.classList.remove('confirm-open');
            }
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[200] grid place-items-center p-6" role="presentation">
            <div className="absolute inset-0 bg-[oklch(22%_0.02_255/0.42)]" onClick={onDismiss} />
            <div
                className={cn(
                    'relative z-[1] animate-confirm-in gap-[var(--space-sm)] rounded-lg border border-rule bg-paper p-[var(--space-md)] shadow-lg max-md:gap-[var(--space-xs)] max-md:rounded-[calc(var(--radius-card)+2px)] max-md:p-[var(--space-sm)]',
                    kindClass[kind],
                    className,
                )}
                role={kind === 'confirm' ? 'alertdialog' : 'dialog'}
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={message != null && message !== '' ? messageId : undefined}
            >
                <div className="flex shrink-0 items-start justify-between gap-[var(--space-sm)]">
                    <h2 className="m-0 min-w-0 flex-1 font-display text-[length:var(--text-md)] font-semibold leading-[1.3] text-ink" id={titleId}>
                        {title}
                    </h2>
                    <div className="flex shrink-0 items-center gap-[0.5rem]">
                        {headerAction}
                        <CloseBtn onClick={onDismiss} autoFocus={focusClose} />
                    </div>
                </div>
                {message != null && message !== '' ? (
                    <p className={cn('m-0 shrink-0 text-sm leading-[1.45] text-ink-2', messageClassName)} id={messageId}>
                        {message}
                    </p>
                ) : null}
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
        <ConfirmDialog title={pending.title} message={pending.message} onDismiss={() => close(false)} focusClose={pending.danger}>
            <DialogActions>
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
            </DialogActions>
        </ConfirmDialog>
    ) : null;

    return { ask, dialog };
}

/** Dialog footer: actions only, primary/danger last. Closing is always «Cerrar» top-right (`ConfirmDialog`). */
export function DialogActions({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('mt-[0.25rem] flex shrink-0 flex-wrap justify-end gap-[0.5rem]', className)}>{children}</div>;
}

/** Icon-only «Cerrar»: rendered by every `ConfirmDialog` in its top-right corner. */
export function CloseBtn({ onClick, autoFocus }: { onClick: () => void; autoFocus?: boolean }) {
    return (
        <Btn type="button" variant="outline" size="icon" aria-label="Cerrar" title="Cerrar" autoFocus={autoFocus} onClick={onClick}>
            <X className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
        </Btn>
    );
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
