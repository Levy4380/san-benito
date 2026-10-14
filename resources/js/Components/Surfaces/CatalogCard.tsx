import { Btn } from '@/Components/Form/Btn';
import { focusVisibleClass } from '@/lib/clinico-control';
import { phoneInteractivePadClass } from '@/lib/mobile-chrome';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { Link } from '@inertiajs/react';
import { CalendarClock, CalendarDays, Info, Link2, UserPlus } from 'lucide-react';
import { useLayoutEffect, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

const catalogCardBase = cn(
    'flex flex-col items-stretch gap-[0.65rem] rounded-lg border border-rule bg-paper px-[var(--space-sm)] py-[0.7rem] text-left font-inherit text-ink no-underline transition-[border-color,background-color] duration-short ease-out [&_strong]:font-display [&_strong]:text-[length:var(--text-md)] [&_strong]:font-semibold [&_span:not([class*="inline-flex"])]:text-sm [&_span:not([class*="inline-flex"])]:text-ink-2',
    phoneInteractivePadClass,
);

const catalogCardInteractive = cn('cursor-pointer hover:border-accent', focusVisibleClass);

export type CatalogAction =
    | { kind: 'info'; href: string; name?: string }
    | { kind: 'slots'; href: string }
    | { kind: 'agenda'; href: string; name?: string }
    | { kind: 'assign'; onClick: () => void }
    | { kind: 'link'; onClick: () => void };

export type CatalogLayout = 'grid' | 'list';

type Common = {
    children?: ReactNode;
    className?: string;
    selected?: boolean;
    asChild?: boolean;
    title?: string;
    lines?: string[];
    actions?: CatalogAction[];
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

function CatalogActionButtons({ actions, className }: { actions: CatalogAction[]; className?: string }) {
    return (
        <CatalogCardActions className={className}>
            {actions.map((action) => {
                if (action.kind === 'info') {
                    const aria = action.name ? `Más información de ${action.name}` : 'Más información';

                    return (
                        <Btn key={`info-${action.href}`} size="sm" variant="outline" asChild>
                            <Link href={action.href} aria-label={aria} title={aria}>
                                <Info className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Más información
                            </Link>
                        </Btn>
                    );
                }

                if (action.kind === 'slots') {
                    return (
                        <Btn key={`slots-${action.href}`} size="sm" asChild>
                            <Link href={action.href}>
                                <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Ver turnos
                            </Link>
                        </Btn>
                    );
                }

                if (action.kind === 'agenda') {
                    const aria = action.name ? `Ver agenda de ${action.name}` : 'Ver agenda';

                    return (
                        <Btn key={`agenda-${action.href}`} size="sm" asChild>
                            <Link href={action.href} aria-label={aria} title={aria}>
                                <CalendarDays className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Ver agenda
                            </Link>
                        </Btn>
                    );
                }

                if (action.kind === 'assign') {
                    return (
                        <Btn key="assign" type="button" size="sm" onClick={action.onClick}>
                            <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Asignar turno
                        </Btn>
                    );
                }

                return (
                    <Btn key="link" type="button" size="sm" onClick={action.onClick}>
                        <Link2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Vincular
                    </Btn>
                );
            })}
        </CatalogCardActions>
    );
}

function CatalogLines({ lines }: { lines: string[] }) {
    return lines.map((line, index) => <span key={`${index}-${line}`}>{line}</span>);
}

export default function CatalogCard({
    as,
    asChild = false,
    selected = false,
    className,
    children,
    title,
    lines,
    actions,
    ...props
}: Props) {
    const structured = title !== undefined;
    const resolvedAs = as ?? (structured ? 'div' : 'button');
    const interactive = asChild || resolvedAs === 'button' || typeof (props as { onClick?: unknown }).onClick === 'function';
    const classes = cn(catalogCardBase, interactive && catalogCardInteractive, selected && 'border-accent bg-accent-soft', className);
    const meta = lines ?? [];
    const actionButtons = actions && actions.length > 0 ? <CatalogActionButtons actions={actions} className="mt-auto" /> : null;
    const body = structured ? (
        <div className="flex h-full w-full min-w-0 flex-1 flex-col gap-[0.65rem]">
            <div className="flex min-w-0 flex-col gap-[0.65rem]">
                <strong className="min-w-0">{title}</strong>
                {meta.length > 0 ? <CatalogLines lines={meta} /> : null}
            </div>
            {actionButtons}
        </div>
    ) : (
        children
    );

    if (asChild) {
        return (
            <Slot className={classes} {...props}>
                {body}
            </Slot>
        );
    }

    if (resolvedAs === 'div') {
        return (
            <div className={classes} {...(props as HTMLAttributes<HTMLDivElement>)}>
                {body}
            </div>
        );
    }

    return (
        <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
            {body}
        </button>
    );
}

export function CatalogCardActions({ children, className }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const root = ref.current;

        if (!root) {
            return;
        }

        const measure = () => {
            const items = [...root.children] as HTMLElement[];

            if (items.length === 0) {
                return;
            }

            for (const item of items) {
                item.style.width = 'max-content';
            }

            const max = Math.ceil(Math.max(...items.map((item) => item.getBoundingClientRect().width)));
            const styles = getComputedStyle(root);
            const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
            const available = root.parentElement?.clientWidth ?? root.clientWidth;
            const needed = max * items.length + gap * (items.length - 1);
            const width = needed > available ? Math.floor((available - gap * (items.length - 1)) / items.length) : max;

            for (const item of items) {
                item.style.width = `${width}px`;
            }
        };

        let cancelled = false;

        measure();
        window.addEventListener('resize', measure);
        void document.fonts?.ready.then(() => {
            if (!cancelled) {
                measure();
            }
        });

        return () => {
            cancelled = true;
            window.removeEventListener('resize', measure);
        };
    }, [children]);

    return (
        <div ref={ref} className={cn('mt-auto flex w-max max-w-full flex-row flex-nowrap items-stretch gap-[0.35rem]', className)}>
            {children}
        </div>
    );
}

export function CatalogGrid({
    layout = 'grid',
    children,
    className,
}: {
    layout?: CatalogLayout;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid min-h-0 w-full flex-1 content-start gap-[var(--space-sm)] overflow-y-auto',
                layout === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:[grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))]',
                className,
            )}
        >
            {children}
        </div>
    );
}
