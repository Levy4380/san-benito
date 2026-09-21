import { Btn, type BtnProps } from '@/Components/Form/Btn';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
    meta?: ReactNode;
    children: ReactNode;
    /** Panel footer (no float shadow). Default: floating bar on phone. */
    variant?: 'float' | 'panel';
    className?: string;
};

/**
 * Wizard footer: meta left + primary CTA right.
 * Hairline top only — no drop shadow (Programar / agenda sticky bars).
 */
export default function WizardStickyCta({ meta, children, variant = 'float', className }: Props) {
    return (
        <div
            data-wizard-cta=""
            className={cn(
                'flex shrink-0 items-center justify-between gap-[0.65rem] border-t border-rule bg-paper',
                variant === 'float' &&
                    'sticky bottom-0 z-[6] mt-auto px-[var(--space-xs)] py-[0.45rem] md:px-[var(--space-sm)] md:py-[0.65rem]',
                variant === 'panel' && 'mt-auto pt-[var(--space-sm)]',
                className,
            )}
        >
            {meta ? <p className="m-0 min-w-0 flex-1 text-sm leading-[1.35] text-ink-2 max-md:text-xs">{meta}</p> : <span className="min-w-0 flex-1" />}
            <div className="flex shrink-0 items-center gap-[0.5rem]">{children}</div>
        </div>
    );
}

type ActionProps = BtnProps;

export function WizardStickyAction({ children, className, ...props }: ActionProps) {
    return (
        <Btn type="button" className={cn('shrink-0', className)} {...props}>
            {children}
        </Btn>
    );
}
