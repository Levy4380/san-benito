import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';

export type ViewSwitchOption<T extends string> = {
    value: T;
    label: string;
    icon: LucideIcon;
};

type Props<T extends string> = {
    options: readonly ViewSwitchOption<T>[];
    defaultValue: T;
    value: T;
    onChange: (value: T) => void;
    className?: string;
};

export default function ViewSwitch<T extends string>({ options, defaultValue, value, onChange, className }: Props<T>) {
    const labelId = useId();

    return (
        <div className={cn('inline-flex flex-col items-stretch gap-[0.35rem] max-md:w-full', className)}>
            <span id={labelId} className="text-sm leading-[1.3] font-medium text-ink max-md:text-xs">
                Cambiar vista:
            </span>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="inline-flex h-[var(--control-h)] min-h-[var(--control-h)] items-stretch rounded-md border border-rule bg-paper p-[0.15rem] max-md:h-[var(--control-h-sm)] max-md:min-h-[var(--control-h-sm)] max-md:w-full"
            >
                {options.map(({ value: option, label, icon: Icon }) => {
                    const on = (value ?? defaultValue) === option;

                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            className={cn(
                                `inline-flex flex-1 cursor-pointer items-center justify-center gap-[0.35rem] rounded-sm border-0 px-[var(--btn-pad-x)] text-sm font-medium leading-[1.2] whitespace-nowrap transition-[background-color,color] duration-short ease-out max-md:px-[0.55rem] max-md:text-xs ${focusVisibleClass}`,
                                on ? 'bg-accent text-accent-ink' : 'bg-transparent text-ink-2 hover:text-ink',
                            )}
                            onClick={() => onChange(option)}
                        >
                            <Icon className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
