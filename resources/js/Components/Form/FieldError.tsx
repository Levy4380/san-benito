import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLParagraphElement> & {
    children?: ReactNode;
};

export default function FieldError({ children, className, ...props }: Props) {
    if (!children) {
        return null;
    }

    return (
        <p {...props} className={cn('text-sm text-danger', className)}>
            {children}
        </p>
    );
}
