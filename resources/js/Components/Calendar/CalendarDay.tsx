import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import type { CalDay } from '@/lib/datetime';

const dayVariants = cva(
    'm-0 flex h-full w-full min-h-0 min-w-0 items-center justify-center rounded-md border-0 p-0 text-center font-mono text-[clamp(0.68rem,5cqh,var(--text-sm))] font-medium leading-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
    {
        variants: {
            tone: {
                empty: 'bg-day text-day-ink',
                has: 'bg-day-has text-day-has-ink',
                full: 'bg-day-full font-semibold text-day-full-ink',
            },
            muted: {
                true: 'cursor-default opacity-35',
                false: 'cursor-pointer',
            },
            paint: {
                true: '',
                false: '',
            },
        },
        compoundVariants: [{ muted: false, paint: true, class: 'cursor-crosshair' }],
        defaultVariants: {
            tone: 'empty',
            muted: false,
            paint: false,
        },
    },
);

type Props = {
    day: CalDay;
    tone?: 'empty' | 'has' | 'full';
    selected?: boolean;
    muted?: boolean;
    disabled?: boolean;
    paint?: boolean;
    onClick?: () => void;
};

export default function CalendarDay({
    day,
    tone = 'empty',
    selected = false,
    muted = false,
    disabled = false,
    paint = false,
    onClick,
}: Props) {
    return (
        <button
            type="button"
            data-day={day.inMonth ? day.key : undefined}
            disabled={disabled || muted}
            className={cn(
                dayVariants({ tone, muted, paint: paint && !disabled && !muted }),
                selected && 'bg-accent text-accent-ink shadow-[inset_0_0_0_2px_var(--color-day-ring)]',
            )}
            onClick={onClick}
        >
            {day.day}
        </button>
    );
}
