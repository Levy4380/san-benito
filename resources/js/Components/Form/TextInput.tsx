import { controlClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import * as React from 'react';

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({ className, type = 'text', ...props }, ref) => {
    return <input ref={ref} type={type} className={cn(controlClass(), className)} {...props} />;
});
TextInput.displayName = 'TextInput';

export default TextInput;
