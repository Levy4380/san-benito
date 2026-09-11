import FieldError from '@/Components/Form/FieldError';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
    label: ReactNode;
    htmlFor?: string;
    error?: ReactNode;
    hint?: ReactNode;
    flush?: boolean;
    children: ReactNode;
    className?: string;
};

export default function Field({ label, htmlFor, error, hint, flush = false, children, className }: Props) {
    return (
        <div className={cn('grid content-start gap-[0.35rem]', flush ? 'mb-0' : 'mb-[var(--space-sm)]', className)}>
            <label htmlFor={htmlFor} className="text-sm leading-[1.3] font-medium text-ink">
                {label}
            </label>
            {children}
            {error ? <FieldError>{error}</FieldError> : null}
            {hint ? <p className="text-sm text-ink-2">{hint}</p> : null}
        </div>
    );
}
