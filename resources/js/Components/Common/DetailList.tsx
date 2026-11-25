import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type DetailRow = [label: string, value: ReactNode];

/** Compact «label value» section inside a detail dialog (turno, cirugía). */
export function DetailBlock({ title, rows, children }: { title: string; rows?: DetailRow[]; children?: ReactNode }) {
    return (
        <section className="grid gap-[0.25rem]">
            <h3 className="m-0 text-sm font-semibold text-ink">{title}</h3>
            {rows ? (
                <dl className="m-0 grid gap-[0.2rem]">
                    {rows.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-[var(--space-sm)]">
                            <dt className="text-ink-2">{label}</dt>
                            <dd className="m-0 text-ink">{value}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}
            {children}
        </section>
    );
}

/** Stack of detail blocks (dialog body). */
export function DetailBlocks({ children }: { children: ReactNode }) {
    return <div className="grid gap-[var(--space-sm)] text-sm">{children}</div>;
}

/** Large stacked fields of an entity profile (paciente, profesional): page or info modal. */
export function ProfileFields({ children, className }: { children: ReactNode; className?: string }) {
    return <dl className={cn('m-0 grid w-full gap-[var(--space-sm)]', className)}>{children}</dl>;
}

export function ProfileField({ label, value, action }: { label: string; value: ReactNode; action?: ReactNode }) {
    return (
        <div className="grid gap-[0.2rem] border-b border-rule pb-[var(--space-sm)] last:border-b-0 last:pb-0">
            <dt className="text-xs font-medium tracking-[0.04em] text-ink-2 uppercase">{label}</dt>
            <dd className="m-0 flex items-center justify-between gap-[0.5rem] text-[length:var(--text-md)] text-ink">
                <span className="min-w-0">{value}</span>
                {action}
            </dd>
        </div>
    );
}
