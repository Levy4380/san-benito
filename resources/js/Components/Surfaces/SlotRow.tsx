import { phoneInteractivePadClass } from '@/lib/mobile-chrome';
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
                'flex min-w-0 flex-nowrap items-start justify-between gap-[0.65rem] rounded-lg border border-rule px-[var(--space-sm)] py-[0.7rem] [&_button]:shrink-0 [&_button]:self-start [&_strong]:font-mono [&_strong]:font-medium',
                phoneInteractivePadClass,
                className,
            )}
        >
            {children}
        </div>
    );
}
