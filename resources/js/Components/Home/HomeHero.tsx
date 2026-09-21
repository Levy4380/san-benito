import type { ReactNode } from 'react';
import { phoneSurfaceRadiusClass } from '@/lib/mobile-chrome';
import { cn } from '@/lib/utils';

type HeroProps = {
    title: ReactNode;
    subtitle: ReactNode;
    children: ReactNode;
};

export default function HomeHero({ title, subtitle, children }: HeroProps) {
    return (
        <div className="relative isolate flex min-h-[min(70vh,36rem)] flex-col items-center justify-center overflow-visible px-[var(--space-sm)] py-[var(--space-md)] text-center max-md:min-h-0 max-md:justify-start max-md:px-0 max-md:py-[var(--space-sm)] max-md:pt-[var(--space-md)]">
            <div
                className="pointer-events-none absolute top-0 right-0 z-0 h-[min(58vw,22rem)] w-[min(58vw,22rem)] overflow-visible min-[900px]:top-[calc(-1*var(--space-lg))] min-[900px]:right-[calc(-1*var(--space-xl))]"
                aria-hidden="true"
            >
                <img
                    src="/images/san-benito-logo.png"
                    alt=""
                    className="block size-full object-contain object-right-top opacity-10 select-none"
                />
            </div>
            <h1 className="relative z-[1] mb-[0.35rem] text-[length:var(--text-display)] max-md:mb-[0.25rem] max-md:text-[1.35rem]">{title}</h1>
            <p className="relative z-[1] mb-[var(--space-lg)] text-[length:var(--text-lg)] text-ink-2 max-md:mb-[var(--space-sm)] max-md:text-[length:var(--text-sm)]">
                {subtitle}
            </p>
            <div className="relative z-[1] flex w-[min(100%,26rem)] flex-col items-stretch gap-[var(--space-md)] max-md:w-full max-md:gap-[var(--space-sm)]">{children}</div>
        </div>
    );
}

export function HomeStartPrimary({ children }: { children: ReactNode }) {
    return <div className="grid w-full gap-[0.55rem] max-md:gap-[0.45rem]">{children}</div>;
}

export function HomeStartSecondary({ children }: { children: ReactNode }) {
    return <div className="grid w-full grid-cols-2 gap-[0.5rem] max-md:gap-[0.4rem]">{children}</div>;
}

export function HomeUpcoming({ title = 'Próximos turnos', actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
    return (
        <div
            className={cn(
                'flex w-full flex-col gap-[0.55rem] rounded-lg border border-rule bg-paper p-[var(--space-sm)] text-left max-md:gap-[0.45rem] max-md:p-[var(--space-xs)]',
                phoneSurfaceRadiusClass,
            )}
        >
            <div className="m-0 flex items-center justify-between gap-[0.5rem] border-b border-rule pb-[0.55rem] max-md:pb-[0.45rem]">
                <strong className="text-[length:var(--text-md)] font-semibold leading-[1.3] max-md:text-[0.95rem]">{title}</strong>
                {actions}
            </div>
            {children}
        </div>
    );
}

export function HomeUpcomingList({ children }: { children: ReactNode }) {
    return <div className="grid gap-[0.35rem] text-left max-md:gap-[0.45rem]">{children}</div>;
}

export function HomeUpcomingItem({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
    return (
        <div className="flex w-full items-start justify-between gap-[0.65rem] rounded-md py-[0.35rem] text-left max-md:min-h-[var(--control-h-sm)] max-md:items-center max-md:py-[0.45rem]">
            <div className="min-w-0 flex-1">{children}</div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
    );
}
