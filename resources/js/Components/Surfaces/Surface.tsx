import { phoneSurfaceRadiusClass } from '@/lib/mobile-chrome';
import { cn } from '@/lib/utils';
import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const surfaceClass = cn(
    'flex min-h-0 flex-col rounded-lg border border-rule bg-paper p-[var(--space-md)] max-md:p-[var(--space-sm)]',
    phoneSurfaceRadiusClass,
);

type DivProps = {
    as?: 'div';
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

type FormProps = {
    as: 'form';
    children: ReactNode;
} & FormHTMLAttributes<HTMLFormElement>;

type Props = DivProps | FormProps;

export default function Surface({ as = 'div', className, children, ...props }: Props) {
    const classes = cn(surfaceClass, className);

    if (as === 'form') {
        return (
            <form className={classes} {...(props as FormHTMLAttributes<HTMLFormElement>)}>
                {children}
            </form>
        );
    }

    return (
        <div className={classes} {...(props as HTMLAttributes<HTMLDivElement>)}>
            {children}
        </div>
    );
}
