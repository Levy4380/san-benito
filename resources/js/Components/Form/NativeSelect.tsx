import { controlClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import * as React from 'react';

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const selectChevron =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23585e67' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(({ className, children, style, ...props }, ref) => {
    return (
        <select
            ref={ref}
            className={cn(
                controlClass(),
                'appearance-none bg-no-repeat pr-9 [background-position:right_0.75rem_center] [background-size:1rem]',
                className,
            )}
            {...props}
            style={{ backgroundImage: selectChevron, ...style }}
        >
            {children}
        </select>
    );
});
NativeSelect.displayName = 'NativeSelect';

export default NativeSelect;
