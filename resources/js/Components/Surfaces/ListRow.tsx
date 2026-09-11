import { Slot } from '@radix-ui/react-slot';
import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const listRowClass = cn(
    'flex w-full min-w-0 flex-nowrap items-center justify-between gap-[0.65rem] rounded-lg border border-rule bg-paper px-[var(--space-sm)] py-[0.7rem] text-left font-inherit text-ink no-underline transition-[border-color] duration-short ease-out max-md:px-[0.9rem] max-md:py-[0.85rem] [&_button]:shrink-0 [&_strong]:font-display [&_strong]:font-semibold',
);

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

export default function ListRow({ as = 'div', asChild = false, className, children, ...props }: Props) {
    const classes = cn(listRowClass, as === 'button' || asChild ? cn('cursor-pointer hover:border-accent', focusVisibleClass) : null, className);

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
