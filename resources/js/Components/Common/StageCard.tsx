import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    layout?: 'single' | 'split';
    nested?: boolean;
    id?: string;
    className?: string;
    children: ReactNode;
};

export default function StageCard({ layout = 'single', nested = false, id, className, children }: Props) {
    return (
        <div
            id={id}
            data-stage=""
            data-agenda={layout === 'split' ? '' : undefined}
            className={cn(
                'flex min-h-0 w-full flex-1 flex-col overflow-hidden',
                layout === 'split' &&
                    'relative grid h-full grid-rows-[minmax(0,1.1fr)_minmax(0,1fr)] items-stretch gap-[var(--space-sm)] overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:grid-rows-[minmax(0,1fr)] md:gap-[var(--space-md)] max-md:flex max-md:h-full max-md:flex-col max-md:items-stretch max-md:justify-center max-md:box-border max-md:pt-[0.35rem] max-md:pb-[calc(18%+0.75rem)] max-md:[&>:first-child]:mx-auto max-md:[&>:first-child]:h-auto max-md:[&>:first-child]:max-h-[min(22rem,58%)] max-md:[&>:first-child]:min-h-[16rem] max-md:[&>:first-child]:w-full max-md:[&>:first-child]:flex-[0_1_auto]',
                nested && '[&>*]:border-0 [&>*]:bg-paper-2',
                className,
            )}
        >
            {children}
        </div>
    );
}
