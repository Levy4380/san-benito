import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
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

    return (
        <>
            <div
                data-band=""
                className={cn(
                    'flex flex-col gap-[var(--space-sm)] md:flex-row md:items-end',
                    className,
                )}
            >
                {listExtras}
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
            </div>
            {open && hasAdvanced ? (
                <ConfirmDialog
                    title="Filtros"
                    onDismiss={() => setOpen(false)}
                    className="max-h-[calc(100dvh-2rem)] w-[min(36rem,100%)] overflow-y-auto"
                >
                    <form
                        key={appliedKey}
                        className="mb-0 flex flex-col gap-[var(--space-md)]"
                        onSubmit={(event: FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            applyFromForm(event.currentTarget);
                        }}
                    >
                        {Object.entries(panelPrimary).map(([name, value]) => (
                            <input key={name} type="hidden" name={name} value={value} />
                        ))}
                        <div className="grid content-start gap-[var(--space-sm)] sm:grid-cols-2">{advanced}</div>
                        <div className="flex flex-wrap items-center justify-end gap-[var(--space-sm)]">
                            <Btn type="button" variant="outline" onClick={() => setOpen(false)}>
                                Volver
                            </Btn>
                            <Btn type="submit">Aplicar</Btn>
                        </div>
                    </form>
                </ConfirmDialog>
            ) : null}
            {children}
        </>
    );
}
