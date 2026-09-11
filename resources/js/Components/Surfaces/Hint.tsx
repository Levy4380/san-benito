import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLParagraphElement> & {
    children?: ReactNode;
};

export default function Hint({ className, children, ...props }: Props) {
    return (
        <p {...props} className={cn('text-sm text-ink-2', className)}>
            {children}
        </p>
    );
}
