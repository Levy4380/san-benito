import type { ReactNode } from 'react';

type HeroProps = {
    title: ReactNode;
    subtitle: ReactNode;
    children: ReactNode;
};

export default function HomeHero({ title, subtitle, children }: HeroProps) {
    return (
        <div className="relative isolate flex min-h-[min(70vh,36rem)] flex-col items-center justify-center overflow-visible px-[var(--space-sm)] py-[var(--space-md)] text-center max-md:min-h-0 max-md:justify-start max-md:px-[var(--space-2xs)] max-md:py-[var(--space-sm)] max-md:pt-[var(--space-md)]">
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
            <h1 className="relative z-[1] mb-[0.35rem] text-[length:var(--text-display)] max-md:text-[1.35rem]">{title}</h1>
            <p className="relative z-[1] mb-[var(--space-lg)] text-[length:var(--text-lg)] text-ink-2 max-md:mb-[var(--space-sm)] max-md:text-[length:var(--text-sm)]">
                {subtitle}
            </p>
            <div className="relative z-[1] flex w-[min(100%,26rem)] flex-col items-stretch gap-[var(--space-md)] max-md:w-full">{children}</div>
        </div>
    );
}

export function HomeStartPrimary({ children }: { children: ReactNode }) {
    return <div className="grid w-full gap-[0.55rem]">{children}</div>;
}

export function HomeStartSecondary({ children }: { children: ReactNode }) {
    return <div className="grid w-full grid-cols-2 gap-[0.5rem]">{children}</div>;
}

export function HomeUpcoming({ title = 'Próximos turnos', actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
    return (
        <div className="flex w-full flex-col gap-[0.55rem] rounded-lg border border-rule bg-paper p-[var(--space-sm)] text-left max-md:rounded-[calc(var(--radius-card)+2px)]">
            <div className="m-0 flex items-center justify-between gap-[0.5rem] border-b border-rule pb-[0.55rem]">
                <strong className="text-[length:var(--text-md)] font-semibold leading-[1.3]">{title}</strong>
                {actions}
            </div>
            {children}
        </div>
    );
}

export function HomeUpcomingList({ children }: { children: ReactNode }) {
    return <div className="grid gap-[0.35rem] text-left">{children}</div>;
}

export function HomeUpcomingItem({ title, meta, actions }: { title: ReactNode; meta: ReactNode; actions?: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between gap-[0.65rem] rounded-md py-[0.35rem] text-left">
            <div className="grid min-w-0 flex-1 gap-[0.1rem]">
                <strong className="text-sm font-medium text-ink">{title}</strong>
                <span className="text-xs text-ink-2">{meta}</span>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
    );
}
