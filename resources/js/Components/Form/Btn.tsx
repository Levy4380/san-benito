import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';

const btnVariants = cva(
    `inline-flex items-center justify-center gap-[0.35rem] box-border rounded-md border border-transparent px-[var(--btn-pad-x)] font-medium leading-[1.2] whitespace-nowrap no-underline cursor-pointer transition-[background-color,color,border-color,box-shadow,filter] duration-short ease-out active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100 ${focusVisibleClass} max-md:text-xs`,
    {
        variants: {
            variant: {
                primary: 'bg-accent text-accent-ink shadow-sm hover:brightness-105 hover:text-accent-ink',
                outline:
                    'border-rule bg-paper text-ink shadow-none hover:border-accent hover:bg-accent hover:text-accent-ink disabled:hover:border-rule disabled:hover:bg-paper disabled:hover:text-ink',
                danger: 'bg-danger text-white shadow-sm hover:brightness-105 hover:text-white',
            },
            size: {
                md: 'h-[var(--control-h)] min-h-[var(--control-h)] text-sm',
                sm: 'h-[var(--control-h-sm)] min-h-[var(--control-h-sm)] px-[0.65rem] text-xs shadow-none max-md:px-[0.55rem] max-md:text-[0.7rem]',
                xs: 'h-[1.55rem] min-h-[1.55rem] px-[0.45rem] text-[0.65rem] gap-[0.2rem] shadow-none max-md:h-[1.75rem] max-md:min-h-[1.75rem] max-md:px-[0.5rem] max-md:text-[0.7rem]',
                icon: 'size-[var(--control-h-sm)] min-h-[var(--control-h-sm)] p-0 text-[1.35rem] font-semibold leading-none shadow-none',
            },
            block: {
                true: 'w-full',
                false: '',
            },
            prominence: {
                cta: 'h-auto min-h-[calc(var(--control-h)+0.25rem)] w-full text-[length:var(--text-md)] font-semibold max-md:min-h-[var(--control-h)] max-md:text-[length:var(--text-sm)]',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            block: false,
        },
    },
);

export type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof btnVariants> & {
        asChild?: boolean;
    };

const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
    ({ className, variant, size, block, prominence, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        return <Comp className={cn(btnVariants({ variant, size, block, prominence }), className)} ref={ref} {...props} />;
    },
);
Btn.displayName = 'Btn';

export { Btn, btnVariants };
