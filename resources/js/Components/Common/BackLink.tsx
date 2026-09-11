import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const backLinkClass = cn(
    'inline-flex items-center gap-[0.4rem] border-0 bg-transparent p-0 font-medium leading-[1.25] text-ink-2 no-underline hover:text-accent',
    focusVisibleClass,
);

function BackChevron() {
    return <ChevronLeft className="size-[1.05em] min-h-[1.05em] min-w-[1.05em] shrink-0" aria-hidden strokeWidth={2} />;
}

type Common = {
    children: ReactNode;
    className?: string;
};

type HrefProps = Common & {
    href: string;
    onClick?: never;
};

type ButtonProps = Common &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
        href?: never;
    };

type Props = HrefProps | ButtonProps;

export default function BackLink({ children, className, ...props }: Props) {
    const classes = cn(backLinkClass, className);

    if ('href' in props && props.href) {
        return (
            <Link href={props.href} className={classes}>
                <BackChevron />
                {children}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} {...(props as ButtonProps)}>
            <BackChevron />
            {children}
        </button>
    );
}
