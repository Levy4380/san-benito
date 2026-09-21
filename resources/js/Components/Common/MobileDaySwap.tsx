import BackLink from '@/Components/Common/BackLink';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
    /** true = day/detail panel; false = calendar only */
    dayOpen: boolean;
    onBackToCalendar: () => void;
    calendar: ReactNode;
    panel: ReactNode;
    backLabel?: string;
    className?: string;
};

/**
 * Phone-only: calendar XOR day panel (never both).
 * md+ layouts stay in the parent (split / sheet).
 */
export default function MobileDaySwap({
    dayOpen,
    onBackToCalendar,
    calendar,
    panel,
    backLabel = 'Calendario',
    className,
}: Props) {
    return (
        <div className={cn('flex h-full min-h-0 flex-1 flex-col md:hidden', className)}>
            {!dayOpen ? (
                <div className="flex min-h-0 flex-1 items-center justify-center">{calendar}</div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-xs)]">
                    <BackLink className="shrink-0 self-start" onClick={onBackToCalendar}>
                        {backLabel}
                    </BackLink>
                    <div className="min-h-0 flex-1">{panel}</div>
                </div>
            )}
        </div>
    );
}
