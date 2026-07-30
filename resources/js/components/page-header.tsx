import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
    title: string;
    description?: string;
    className?: string;
    actions?: ReactNode;
};

export function PageHeader({ title, description, className, actions }: PageHeaderProps) {
    return (
        <header className={cn('flex flex-col gap-3 border-b border-[var(--color-rule)] pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0">
                <h1 className="font-display text-[length:var(--text-display-s)] leading-tight text-[var(--color-ink)]">{title}</h1>
                {description ? <p className="mt-2 max-w-prose text-[length:var(--text-sm)] text-[var(--color-ink-2)]">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>
    );
}
