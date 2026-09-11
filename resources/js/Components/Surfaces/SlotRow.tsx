import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
};

export default function SlotRow({ className, children, ...props }: Props) {
    return (
        <div
            {...props}
            className={cn(
                'flex min-w-0 flex-nowrap items-center justify-between gap-[0.65rem] rounded-lg border border-rule px-[var(--space-sm)] py-[0.7rem] max-md:px-[0.9rem] max-md:py-[0.85rem] [&_button]:shrink-0 [&_strong]:font-mono [&_strong]:font-medium',
                className,
            )}
        >
            {children}
        </div>
    );
}
