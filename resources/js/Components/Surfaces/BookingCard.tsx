import { Slot } from '@radix-ui/react-slot';
import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const bookingCardClass =
    'flex min-w-0 flex-col gap-[0.15rem] rounded-lg border border-rule bg-paper-2 px-[0.7rem] py-[0.4rem] font-inherit text-ink no-underline transition-[border-color] duration-short ease-out [&_h3]:text-sm [&_h3]:[overflow-wrap:anywhere] [&_strong]:font-display [&_strong]:text-sm [&_strong]:font-semibold [&_button]:shrink-0';

type Common = {
    children: ReactNode;
    className?: string;
    asChild?: boolean;
};

type DivProps = Common &
    HTMLAttributes<HTMLDivElement> & {
        as?: 'div';
    };

type ButtonProps = Common &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        as: 'button';
    };

type Props = DivProps | ButtonProps;

export default function BookingCard({ as = 'div', asChild = false, className, children, ...props }: Props) {
    const interactive = as === 'button' || asChild;
    const classes = cn(bookingCardClass, interactive ? cn('cursor-pointer hover:border-accent', focusVisibleClass) : null, className);

    if (asChild) {
        return (
            <Slot className={classes} {...props}>
                {children}
            </Slot>
        );
    }

    if (as === 'button') {
        return (
            <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
                {children}
            </button>
        );
    }

    return (
        <div className={classes} {...(props as HTMLAttributes<HTMLDivElement>)}>
            {children}
        </div>
    );
}

export function BookingList({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('grid min-h-0 w-full flex-1 content-start gap-[0.5rem] overflow-y-auto mt-2', className)}>
            {children}
        </div>
    );
}

export function BookingCardRow({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex min-w-0 items-center justify-between gap-[0.4rem]', className)}>{children}</div>;
}

export function BookingCardGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[0.4rem] gap-y-[0.15rem] [&>a]:w-full [&>button]:w-full',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function BookingCardActions({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex shrink-0 flex-col items-stretch gap-[0.2rem]', className)}>{children}</div>;
}
