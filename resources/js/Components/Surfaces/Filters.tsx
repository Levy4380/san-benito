import { Btn } from '@/Components/Form/Btn';
import { cn } from '@/lib/utils';
import { ListFilter, Search } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';

export type FilterValues = Record<string, string>;

type Props = {
    primary: ReactNode;
    advanced?: ReactNode;
    applied?: FilterValues;
    onApply: (data: FilterValues) => void;
    listExtras?: ReactNode;
    children?: ReactNode;
    className?: string;
};

function entriesFromForm(form: HTMLFormElement): FilterValues {
    return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [key, String(value)]));
}

export default function Filters({ primary, advanced, applied = {}, onApply, listExtras, children, className }: Props) {
    const [open, setOpen] = useState(false);
    const [panelPrimary, setPanelPrimary] = useState<FilterValues>({});
    const listFormRef = useRef<HTMLFormElement>(null);
    const appliedKey = useMemo(() => JSON.stringify(applied), [applied]);
    const hasAdvanced = advanced != null;

    const applyFromForm = (form: HTMLFormElement) => {
        onApply(entriesFromForm(form));
        setOpen(false);
    };

    const openPanel = () => {
        if (!listFormRef.current) {
            return;
        }

        const fromList = entriesFromForm(listFormRef.current);
        const primaryOnly: FilterValues = { ...fromList };

        for (const key of Object.keys(applied)) {
            delete primaryOnly[key];
        }

        setPanelPrimary(primaryOnly);
        setOpen(true);
    };

    if (open && hasAdvanced) {
        return (
            <form
                key={appliedKey}
                className={cn('mb-0 flex min-h-0 w-full flex-1 flex-col gap-[var(--space-md)]', className)}
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    applyFromForm(event.currentTarget);
                }}
            >
                {Object.entries(panelPrimary).map(([name, value]) => (
                    <input key={name} type="hidden" name={name} value={value} />
                ))}
                <div className="grid min-h-0 flex-1 content-start gap-[var(--space-sm)] overflow-y-auto sm:grid-cols-2">
                    {advanced}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-[var(--space-sm)]">
                    <Btn type="submit">Aplicar</Btn>
                    <Btn type="button" variant="outline" onClick={() => setOpen(false)}>
                        Volver
                    </Btn>
                </div>
            </form>
        );
    }

    return (
        <>
            <div
                data-band=""
                className={cn(
                    'flex flex-col gap-[var(--space-sm)] md:flex-row md:items-end',
                    className,
                )}
            >
                <form
                    ref={listFormRef}
                    className={cn(
                        'mb-0 grid w-full min-w-0 shrink-0 items-end gap-[var(--space-sm)] max-md:gap-[var(--space-xs)] md:flex-1',
                        hasAdvanced ? 'sm:grid-cols-[1fr_auto_auto]' : 'sm:grid-cols-[1fr_auto]',
                    )}
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        applyFromForm(event.currentTarget);
                    }}
                >
                    {primary}
                    {Object.entries(applied).map(([name, value]) => (
                        <input key={name} type="hidden" name={name} value={value} />
                    ))}
                    <Btn type="submit" className="self-end">
                        <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Buscar
                    </Btn>
                    {hasAdvanced ? (
                        <Btn type="button" variant="outline" className="self-end" onClick={openPanel}>
                            <ListFilter className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Filtros
                        </Btn>
                    ) : null}
                </form>
                {listExtras}
            </div>
            {children}
        </>
    );
}
