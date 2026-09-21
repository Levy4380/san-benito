import { Slot } from '@radix-ui/react-slot';
import { focusVisibleClass } from '@/lib/clinico-control';
import { phoneInteractivePadClass } from '@/lib/mobile-chrome';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const doctorCardBase = cn(
    'flex flex-col items-stretch gap-[0.65rem] rounded-lg border border-rule bg-paper px-[var(--space-sm)] py-[0.7rem] text-left font-inherit text-ink no-underline transition-[border-color,background-color] duration-short ease-out [&_strong]:font-display [&_strong]:text-[length:var(--text-md)] [&_strong]:font-semibold [&_span:not([class*="inline-flex"])]:text-sm [&_span:not([class*="inline-flex"])]:text-ink-2',
    phoneInteractivePadClass,
);

const doctorCardInteractive = cn('cursor-pointer hover:border-accent', focusVisibleClass);

type Common = {
    children: ReactNode;
    className?: string;
    selected?: boolean;
    asChild?: boolean;
};

type ButtonProps = Common &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        as?: 'button';
    };

type DivProps = Common &
    HTMLAttributes<HTMLDivElement> & {
        as: 'div';
    };

type Props = ButtonProps | DivProps;

export default function DoctorCard({ as = 'button', asChild = false, selected = false, className, children, ...props }: Props) {
    const interactive = asChild || as === 'button' || typeof (props as { onClick?: unknown }).onClick === 'function';
    const classes = cn(doctorCardBase, interactive && doctorCardInteractive, selected && 'border-accent bg-accent-soft', className);

    if (asChild) {
        return (
            <Slot className={classes} {...props}>
                {children}
            </Slot>
        );
    }

    if (as === 'div') {
        return (
            <div className={classes} {...(props as HTMLAttributes<HTMLDivElement>)}>
                {children}
            </div>
        );
    }

    return (
        <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
            {children}
        </button>
    );
}

export function DoctorCardActions({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('mt-auto flex flex-wrap gap-[0.35rem]', className)}>{children}</div>;
}

export function DoctorGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'grid min-h-0 w-full flex-1 content-start gap-[var(--space-sm)] overflow-y-auto [grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))]',
                className,
            )}
        >
            {children}
        </div>
    );
}
