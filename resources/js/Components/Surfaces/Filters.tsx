import { cn } from '@/lib/utils';
import type { FormHTMLAttributes, ReactNode } from 'react';

type Props = FormHTMLAttributes<HTMLFormElement> & {
    children: ReactNode;
    variant?: 'default' | 'one';
};

export default function Filters({ variant = 'default', className, children, ...props }: Props) {
    return (
        <form
            {...props}
            data-band=""
            className={cn(
                'mb-0 grid w-full items-end gap-[var(--space-sm)]',
                variant === 'default' && 'sm:grid-cols-[1fr_1fr_auto]',
                variant === 'one' && 'sm:grid-cols-[1fr_auto]',
                className,
            )}
        >
            {children}
        </form>
    );
}
