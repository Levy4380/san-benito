import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
};

export default function Results({ className, children, ...props }: Props) {
    return (
        <div
            {...props}
            className={cn(
                'flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden rounded-lg border border-rule bg-paper p-[var(--space-md)] max-md:gap-[var(--space-sm)] max-md:rounded-[calc(var(--radius-card)+2px)] max-md:p-[var(--space-sm)] [&>[data-blank]]:my-auto [&>[data-blank]]:w-full [&>[data-blank]]:text-center [&>[data-band]:first-child]:mb-[var(--space-md)] [&>[data-band]:first-child]:border-b [&>[data-band]:first-child]:border-rule [&>[data-band]:first-child]:pb-[var(--space-md)] max-md:[&>[data-band]:first-child]:mb-[var(--space-sm)] max-md:[&>[data-band]:first-child]:pb-[var(--space-sm)]',
                className,
            )}
        >
            {children}
        </div>
    );
}
