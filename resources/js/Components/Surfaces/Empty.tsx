import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLParagraphElement> & {
    children?: ReactNode;
};

export default function Empty({ className, children, ...props }: Props) {
    return (
        <p {...props} data-blank="" className={cn('py-[var(--space-sm)] text-sm text-ink-2', className)}>
            {children}
        </p>
    );
}
