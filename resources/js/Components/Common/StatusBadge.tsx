import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type StatusTone = { background: string; color: string };

/** Pill with a leading dot; shared by appointment and surgery status. */
export default function StatusBadge({
    tone,
    status,
    className,
    children,
}: {
    tone: StatusTone;
    status: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex w-fit items-center gap-[0.35rem] rounded-md px-[0.5rem] py-[0.15rem] text-[length:var(--text-xs)] leading-[1.3] font-medium whitespace-nowrap before:size-[0.45rem] before:rounded-full before:bg-current before:content-['']",
                className,
            )}
            data-status={status}
            style={tone}
        >
            {children}
        </span>
    );
}
