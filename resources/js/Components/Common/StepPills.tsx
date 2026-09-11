import { cn } from '@/lib/utils';

type Step = { key: string; label: string };

type Props = {
    steps: Step[];
    current: string;
};

export default function StepPills({ steps, current }: Props) {
    const currentIndex = steps.findIndex((step) => step.key === current);

    return (
        <div className="flex h-full min-h-0 w-full items-stretch gap-[0.5rem] text-xs">
            {steps.map((step, index) => {
                const done = index < currentIndex;
                const on = index === currentIndex;

                return (
                    <div
                        key={step.key}
                        className={cn(
                            'flex min-w-0 flex-1 flex-col items-stretch justify-center gap-[0.25rem] border-0 bg-transparent p-0 text-center text-ink-2',
                            done && 'text-accent',
                            on && 'text-ink',
                        )}
                    >
                        <span
                            className={cn(
                                'block h-[0.4rem] w-full rounded-[2px] bg-paper-3 transition-[background-color] duration-short ease-out',
                                done && 'bg-accent-soft',
                                on && 'bg-accent',
                            )}
                        />
                        <span
                            className={cn(
                                'overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-[1.25] max-md:text-[0.7rem]',
                                on && 'font-semibold',
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
