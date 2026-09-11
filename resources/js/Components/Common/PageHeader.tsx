import BackLink from '@/Components/Common/BackLink';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Props = {
    title: string;
    description?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    backHref?: string;
    backLabel?: string;
    onBack?: () => void;
    steps?: ReactNode;
};

export default function PageHeader({ title, description, subtitle, actions, backHref, backLabel, onBack, steps }: Props) {
    const showBack = Boolean(backHref || onBack);
    const sub = description ?? subtitle;

    return (
        <header
            className={cn(
                'mb-[var(--space-md)] box-border flex h-[var(--page-header-h)] max-h-[var(--page-header-h)] min-h-[var(--page-header-h)] flex-nowrap items-center justify-between gap-x-[var(--space-md)] gap-y-[var(--space-sm)] overflow-hidden',
                'max-[1199px]:mb-[var(--space-xs)] max-[1199px]:h-auto max-[1199px]:max-h-none max-[1199px]:min-h-0 max-[1199px]:flex-wrap max-[1199px]:items-start max-[1199px]:gap-x-[var(--space-sm)] max-[1199px]:gap-y-[0.55rem] max-[1199px]:overflow-visible',
                'max-md:gap-y-[0.65rem] max-sm:mb-[0.55rem]',
            )}
        >
            <div
                className={cn(
                    'grid h-full min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[var(--page-header-title-h)_var(--page-header-sub-h)] content-center [row-gap:0.2rem]',
                    'max-[1199px]:h-auto max-[1199px]:min-w-0 max-[1199px]:flex-[1_1_10rem] max-[1199px]:grid-rows-[auto_auto]',
                    'max-md:w-full max-md:flex-[1_1_100%] max-md:[row-gap:0.3rem]',
                )}
            >
                {showBack ? (
                    <div
                        className={cn(
                            'z-[1] col-start-1 row-start-1 flex items-center overflow-hidden',
                            'h-[var(--page-header-title-h)] max-h-[var(--page-header-title-h)] min-h-[var(--page-header-title-h)]',
                        )}
                    >
                        {backHref ? (
                            <BackLink
                                href={backHref}
                                className="h-full max-h-full gap-[0.35rem] text-[length:var(--text-xl)] font-semibold leading-none tracking-[-0.02em] max-[1199px]:text-[1.3rem] max-md:text-[1.35rem]"
                            >
                                {backLabel ?? title}
                            </BackLink>
                        ) : (
                            <BackLink
                                className="h-full max-h-full gap-[0.35rem] text-[length:var(--text-xl)] font-semibold leading-none tracking-[-0.02em] max-[1199px]:text-[1.3rem] max-md:text-[1.35rem]"
                                onClick={onBack}
                            >
                                {backLabel ?? title}
                            </BackLink>
                        )}
                    </div>
                ) : null}
                <h1
                    className={cn(
                        'col-start-1 row-start-1 m-0 flex h-[var(--page-header-title-h)] max-h-[var(--page-header-title-h)] min-h-[var(--page-header-title-h)] shrink-0 items-center overflow-hidden text-[length:var(--text-xl)] leading-[1.25]',
                        'max-[1199px]:h-auto max-[1199px]:max-h-none max-[1199px]:min-h-0 max-[1199px]:text-[1.35rem] max-[1199px]:leading-[1.2]',
                        'max-md:text-[1.4rem] max-md:leading-[1.2] max-md:tracking-[-0.025em] max-md:whitespace-normal',
                        showBack && 'invisible',
                    )}
                >
                    {title}
                </h1>
                {steps ? (
                    <div
                        className={cn(
                            'col-start-1 row-start-2 w-full max-[1199px]:h-auto max-[1199px]:min-h-0',
                            'h-[var(--page-header-sub-h)] min-h-[var(--page-header-sub-h)]',
                        )}
                    >
                        {steps}
                    </div>
                ) : sub ? (
                    <p
                        className={cn(
                            'col-start-1 row-start-2 m-0 flex w-full items-center text-sm leading-[1.35] text-ink-2 max-[1199px]:h-auto max-[1199px]:min-h-0 max-md:mt-[0.15rem] max-md:text-[0.8rem]',
                            'h-[var(--page-header-sub-h)] min-h-[var(--page-header-sub-h)]',
                        )}
                    >
                        {sub}
                    </p>
                ) : (
                    <p
                        className={cn(
                            'col-start-1 row-start-2 m-0 w-full max-[1199px]:h-auto max-[1199px]:min-h-0',
                            'h-[var(--page-header-sub-h)] min-h-[var(--page-header-sub-h)]',
                        )}
                    />
                )}
            </div>
            {actions ? (
                <div className="flex shrink-0 flex-nowrap items-end gap-[0.5rem] max-[1199px]:ml-auto max-[1199px]:max-w-full max-[1199px]:flex-wrap max-md:ml-0 max-md:w-full max-md:justify-start">
                    {actions}
                </div>
            ) : null}
        </header>
    );
}
