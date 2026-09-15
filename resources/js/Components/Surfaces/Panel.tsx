import { ResultList } from '@/Components/Surfaces/Results';
import { cn } from '@/lib/utils';
import { CSSProperties, PointerEvent, ReactNode, useRef, useState } from 'react';

const COLLAPSED_PCT = 13;
const EXPANDED_PCT = 72;
const SNAP_PCT = 40;

type Props = {
    children: ReactNode;
    className?: string;
    title?: ReactNode;
    sheet?: boolean;
};

export function PanelScroll({ children, className }: { children: ReactNode; className?: string }) {
    return <ResultList className={cn('pt-[0.75rem] max-md:pt-[0.5rem]', className)}>{children}</ResultList>;
}

export default function Panel({ children, className, title, sheet = false }: Props) {
    const [collapsed, setCollapsed] = useState(true);
    const [pct, setPct] = useState(COLLAPSED_PCT);
    const [dragging, setDragging] = useState(false);
    const startY = useRef(0);
    const startPct = useRef(COLLAPSED_PCT);
    const moved = useRef(false);

    const snap = (value: number) => {
        const nextCollapsed = value < SNAP_PCT;
        setCollapsed(nextCollapsed);
        setPct(nextCollapsed ? COLLAPSED_PCT : EXPANDED_PCT);
    };

    const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        if (!sheet || event.button !== 0) {
            return;
        }
        event.preventDefault();
        moved.current = false;
        startY.current = event.clientY;
        startPct.current = pct;
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        if (!dragging) {
            return;
        }
        const parent = event.currentTarget.closest('[data-agenda]');
        const height = parent instanceof HTMLElement ? parent.clientHeight : window.innerHeight;
        const delta = ((startY.current - event.clientY) / Math.max(height, 1)) * 100;
        if (Math.abs(delta) > 2) {
            moved.current = true;
        }
        setPct(Math.min(88, Math.max(COLLAPSED_PCT, startPct.current + delta)));
    };

    const onPointerUp = () => {
        if (!dragging) {
            return;
        }
        setDragging(false);
        if (!moved.current) {
            const next = !collapsed;
            setCollapsed(next);
            setPct(next ? COLLAPSED_PCT : EXPANDED_PCT);
            return;
        }
        snap(pct);
    };

    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-rule bg-paper p-[var(--space-sm)] md:p-[var(--space-md)] max-md:rounded-[calc(var(--radius-card)+2px)]',
                sheet &&
                    'max-md:absolute max-md:right-[0.45rem] max-md:bottom-[0.45rem] max-md:left-[0.45rem] max-md:z-[8] max-md:h-[var(--sheet-h,13%)] max-md:max-h-[88%] max-md:min-h-0 max-md:touch-pan-y max-md:gap-0 max-md:p-[0.2rem_1.05rem_1.05rem] max-md:shadow-[0_-8px_24px_oklch(22%_0.02_255/0.16)]',
                sheet && dragging && 'max-md:transition-none',
                sheet && !dragging && 'max-md:transition-[height] max-md:duration-[240ms] max-md:ease-out',
                sheet && collapsed && 'max-md:overflow-hidden max-md:pb-[0.65rem] max-md:[&>:not([data-sheet-handle]):not(h2)]:hidden',
                className,
            )}
            style={sheet ? ({ '--sheet-h': `${pct}%` } as CSSProperties) : undefined}
        >
            {sheet ? (
                <button
                    type="button"
                    data-sheet-handle
                    aria-label={collapsed ? 'Expandir panel del día' : 'Contraer panel del día'}
                    className="hidden w-full min-h-[1.35rem] flex-none cursor-grab touch-none items-center justify-center overflow-visible border-0 bg-transparent p-[0.4rem_0_0.2rem] text-ink-2 max-md:flex active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <span
                        className={cn('relative block h-[0.55rem] w-[1.45rem] overflow-visible', collapsed && 'scale-y-[-1]')}
                        aria-hidden="true"
                    >
                        <span className="absolute top-[0.18rem] left-0 h-[2px] w-[0.82rem] origin-left rotate-[28deg] rounded-[1px] bg-current" />
                        <span className="absolute top-[0.18rem] right-0 h-[2px] w-[0.82rem] origin-right -rotate-[28deg] rounded-[1px] bg-current" />
                    </span>
                </button>
            ) : null}
            {title ? (
                <h2
                    className={cn(
                        'shrink-0',
                        sheet && 'max-md:mt-[0.1rem] max-md:text-[0.95rem] max-md:font-semibold max-md:leading-[1.25]',
                        sheet && collapsed && 'max-md:m-0 max-md:pb-[0.2rem]',
                    )}
                >
                    {title}
                </h2>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
    );
}
