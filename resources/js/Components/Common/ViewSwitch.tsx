import { Calendar, List } from 'lucide-react';
import { useId } from 'react';
import { focusVisibleClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'cal';

type Props = {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
};

const options = [
    { value: 'list' as const, label: 'Lista', Icon: List },
    { value: 'cal' as const, label: 'Calendario', Icon: Calendar },
];

export default function ViewSwitch({ value, onChange, className }: Props) {
    const labelId = useId();

    return (
        <div className={cn('inline-flex flex-col items-stretch gap-[0.35rem]', className)}>
            <span id={labelId} className="text-sm leading-[1.3] font-medium text-ink">
                Cambiar vista:
            </span>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="inline-flex h-[var(--control-h)] min-h-[var(--control-h)] items-stretch rounded-md border border-rule bg-paper p-[0.15rem]"
            >
                {options.map(({ value: option, label, Icon }) => {
                    const on = value === option;

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
