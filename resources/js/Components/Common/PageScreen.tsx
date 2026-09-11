import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Layout = 'single' | 'split' | 'home';

type Props = {
    layout?: Layout;
    header?: ReactNode;
    children: ReactNode;
};

export default function PageScreen({ layout = 'single', header, children }: Props) {
    return (
        <section
            className={cn(
                'flex h-full min-h-0 w-full flex-1 flex-col animate-fade motion-reduce:animate-[fade_150ms_linear]',
                layout === 'home' && 'justify-center overflow-visible',
                layout === 'split' && 'max-h-full overflow-hidden',
                'has-[[data-stage]]:max-h-full has-[[data-stage]]:overflow-hidden',
            )}
        >
            {layout === 'home' ? null : header}
            {children}
        </section>
    );
}
