import BackLink from '@/Components/Common/BackLink';
import { Btn } from '@/Components/Form/Btn';
import CatalogCard from '@/Components/Surfaces/CatalogCard';
import Results from '@/Components/Surfaces/Results';
import { cn } from '@/lib/utils';
import { CalendarDays, HeartPulse, Search, Shield, Stethoscope, UserRound, type LucideIcon } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

export type HistoryCriterion = 'date' | 'professional' | 'patient' | 'specialty' | 'insurance';

export type HistoryCriterionOption = {
    key: HistoryCriterion;
    label: string;
    icon: LucideIcon;
};

export const appointmentCriteria = (includeProfessional: boolean): HistoryCriterionOption[] => [
    { key: 'date', label: 'Fecha', icon: CalendarDays },
    ...(includeProfessional ? [{ key: 'professional' as const, label: 'Doctor', icon: Stethoscope }] : []),
    { key: 'patient', label: 'Paciente', icon: UserRound },
    { key: 'specialty', label: 'Especialidad', icon: HeartPulse },
];

export const surgeryCriteria = (includeProfessional: boolean): HistoryCriterionOption[] => [
    { key: 'date', label: 'Fecha', icon: CalendarDays },
    ...(includeProfessional ? [{ key: 'professional' as const, label: 'Doctor', icon: Stethoscope }] : []),
    { key: 'patient', label: 'Paciente', icon: UserRound },
    { key: 'insurance', label: 'Obra social', icon: Shield },
];

export function HistorySearchHub({
    options,
    onSelect,
}: {
    options: HistoryCriterionOption[];
    onSelect: (key: HistoryCriterion) => void;
}) {
    const three = options.length === 3;

    return (
        <Results className="@container [container-type:size]">
            <h2 className="m-0 shrink-0 font-display text-[length:var(--text-md)] font-semibold tracking-[-0.02em] text-ink">
                Buscar por:
            </h2>
            <div className="flex min-h-0 min-w-0 flex-1 items-start justify-center min-[1200px]:items-center">
                <div
                    className={cn(
                        // <1200: columna petisa compacta. ≥1200: grilla cuadrada sized al shell (cqmin).
                        'grid w-full min-w-0 max-w-[40rem] grid-cols-1 gap-[var(--space-2xs)]',
                        three
                            ? 'min-[1200px]:max-w-none min-[1200px]:w-[min(100%,80cqmin)] min-[1200px]:grid-cols-3 min-[1200px]:gap-[var(--space-sm)]'
                            : 'min-[1200px]:max-w-none min-[1200px]:w-[min(100%,80cqmin)] min-[1200px]:grid-cols-2 min-[1200px]:gap-[var(--space-sm)]',
                    )}
                >
                    {options.map((option) => {
                        const Icon = option.icon;

                        return (
                            <CatalogCard
                                key={option.key}
                                className={cn(
                                    'w-full min-w-0 items-center justify-center text-center',
                                    'aspect-auto min-h-[var(--control-h)] flex-row gap-[0.55rem] px-[var(--space-sm)] py-[0.55rem]',
                                    'min-[1200px]:aspect-square min-[1200px]:min-h-0 min-[1200px]:flex-col min-[1200px]:gap-[0.65rem] min-[1200px]:py-[0.7rem]',
                                )}
                                onClick={() => onSelect(option.key)}
                            >
                                <Icon className="size-[1.15rem] shrink-0 text-accent min-[1200px]:size-[1.75rem]" aria-hidden strokeWidth={1.75} />
                                <strong className="text-[length:var(--text-sm)] min-[1200px]:text-[length:var(--text-md)]">
                                    {option.label}
                                </strong>
                            </CatalogCard>
                        );
                    })}
                </div>
            </div>
        </Results>
    );
}

export function HistoryCriterionForm({
    title,
    onBack,
    onSubmit,
    children,
}: {
    title: string;
    onBack: () => void;
    onSubmit: () => void;
    children: ReactNode;
}) {
    return (
        <Results>
            <BackLink className="shrink-0 self-start" onClick={onBack}>
                Buscar por
            </BackLink>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[var(--space-md)]">
                <form
                    className="mb-0 flex w-full max-w-[22rem] flex-col items-stretch gap-[var(--space-md)]"
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                >
                    <h2 className="m-0 text-center font-display text-[length:var(--text-md)] font-semibold tracking-[-0.02em] text-ink">
                        {title}
                    </h2>
                    {children}
                    <Btn type="submit" block>
                        <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Buscar
                    </Btn>
                    <p className="m-0 text-center text-xs text-ink-2">Ese valor queda fijo. Después podés filtrar por el resto.</p>
                </form>
            </div>
        </Results>
    );
}
