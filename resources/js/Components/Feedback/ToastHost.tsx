import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toastHostClass } from '@/lib/mobile-chrome';
import type { SharedData, ToastVariant } from '@/types';

type Toast = { id: number; message: string; variant: ToastVariant };

function flattenErrors(errors: SharedData['errors']): string[] {
    if (!errors) {
        return [];
    }

    return Object.values(errors).flatMap((value) => (Array.isArray(value) ? value : [value])).filter(Boolean);
}

export default function ToastHost() {
    const { flash, errors } = usePage<SharedData>().props;
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(1);

    const push = (message: string, variant: ToastVariant) => {
        const trimmed = message.trim();
        if (!trimmed) {
            return;
        }

        const id = nextId.current++;
        setToasts((current) => {
            if (current.some((toast) => toast.message === trimmed)) {
                return current;
            }

            return [...current, { id, message: trimmed, variant }];
        });
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, variant === 'warn' ? 6000 : 3400);
    };

    useEffect(() => {
        if (flash.toast?.message) {
            push(flash.toast.message, flash.toast.variant ?? 'info');
            return;
        }

        const joined = flattenErrors(errors).join(' ');
        if (joined) {
            push(joined, 'warn');
        }
    }, [flash.toast, errors]);

    useEffect(() => {
        const offException = router.on('exception', (event) => {
            const exception = event.detail.exception;
            const message = exception instanceof Error ? exception.message : String(exception ?? 'Error de red.');
            push(message || 'Error de red.', 'warn');
        });
        const offInvalid = router.on('invalid', (event) => {
            const status = event.detail.response?.status;
            if (!status || status === 403 || status === 404) {
                return;
            }
            push(`El servidor rechazó el pedido (${status}).`, 'warn');
        });

        return () => {
            offException();
            offInvalid();
        };
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div
            className={toastHostClass}
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={
                        toast.variant === 'ok'
                            ? 'w-full animate-toast-in rounded-lg bg-accent px-4 py-3 text-sm font-medium leading-[1.35] text-accent-ink shadow-lg'
                            : toast.variant === 'warn'
                              ? 'w-full animate-toast-in rounded-lg bg-danger px-4 py-3 text-sm font-medium leading-[1.35] text-white shadow-lg'
                              : 'w-full animate-toast-in rounded-lg bg-ink px-4 py-3 text-sm font-medium leading-[1.35] text-accent-ink shadow-lg'
                    }
                    role={toast.variant === 'warn' ? 'alert' : 'status'}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
