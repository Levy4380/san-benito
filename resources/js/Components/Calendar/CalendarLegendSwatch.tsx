import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const swatchVariants = cva('inline-block size-[0.55rem] shrink-0 rounded-[2px] border border-day-border', {
    variants: {
        tone: {
            empty: 'bg-day',
            has: 'border-day-has-border bg-day-has',
            full: 'border-day-full-border bg-day-full',
            selected: 'border-accent bg-accent',
        },
    },
    defaultVariants: {
        tone: 'empty',
    },
});

type Props = VariantProps<typeof swatchVariants> & {
    className?: string;
};

export default function CalendarLegendSwatch({ tone, className }: Props) {
    return <span className={cn(swatchVariants({ tone }), className)} aria-hidden="true" />;
}
