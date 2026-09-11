import { controlClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import * as React from 'react';

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(({ className, children, ...props }, ref) => {
    return (
        <select ref={ref} className={cn(controlClass(), className)} {...props}>
            {children}
        </select>
    );
});
NativeSelect.displayName = 'NativeSelect';

export default NativeSelect;
