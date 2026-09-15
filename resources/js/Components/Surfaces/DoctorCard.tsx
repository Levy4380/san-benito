import { Slot } from '@radix-ui/react-slot';
import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const doctorCardClass = cn(
    'flex cursor-pointer flex-col items-stretch gap-[0.65rem] rounded-lg border border-rule bg-paper px-[var(--space-sm)] py-[0.7rem] text-left font-inherit text-ink no-underline transition-[border-color,background-color] duration-short ease-out hover:border-accent max-md:px-[0.9rem] max-md:py-[0.85rem] [&_strong]:font-display [&_strong]:text-[length:var(--text-md)] [&_strong]:font-semibold [&_span]:text-sm [&_span]:text-ink-2',
    focusVisibleClass,
);

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
    const classes = cn(doctorCardClass, selected && 'border-accent bg-accent-soft', className);

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
