import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: ReactNode;
    className?: string;
};

export default function CheckLabel({ checked, onChange, children, className }: Props) {
    return (
        <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-ink', className)}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="size-4 accent-accent"
            />
            {children}
        </label>
    );
}
