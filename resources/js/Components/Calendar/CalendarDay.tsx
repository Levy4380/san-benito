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
            past: {
                true: 'opacity-50',
                false: '',
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
            past: false,
            paint: false,
        },
    },
);

type Props = {
    day: CalDay;
    tone?: 'empty' | 'has' | 'full';
    /** Sanatorium exception. Closed is faded green; a different schedule is solid green. */
    mark?: 'closed' | 'shifted' | null;
    selected?: boolean;
    muted?: boolean;
    past?: boolean;
    disabled?: boolean;
    paint?: boolean;
    onClick?: () => void;
};

export default function CalendarDay({
    day,
    tone = 'empty',
    mark = null,
    selected = false,
    muted = false,
    past = false,
    disabled = false,
    paint = false,
    onClick,
}: Props) {
    const faded = muted && mark !== 'shifted';

    return (
        <button
            type="button"
            data-day={day.inMonth ? day.key : undefined}
            disabled={disabled || muted}
            title={mark === 'closed' ? 'Día cerrado' : mark === 'shifted' ? 'Horario distinto' : undefined}
            className={cn(
                dayVariants({ tone, muted: faded, past: past && !faded && mark !== 'closed', paint: paint && !disabled && !muted }),
                mark === 'closed' && 'bg-day-closed text-day-closed-ink',
                mark === 'closed' && !faded && !selected && 'opacity-45',
                mark === 'shifted' && 'bg-day-shifted text-day-shifted-ink',
                selected && 'bg-accent text-accent-ink shadow-[inset_0_0_0_2px_var(--color-day-ring)]',
            )}
            onClick={onClick}
        >
            {day.day}
        </button>
    );
}
