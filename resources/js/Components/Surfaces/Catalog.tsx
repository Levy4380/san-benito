import ViewSwitch, { type ViewSwitchOption } from '@/Components/Common/ViewSwitch';
import { Btn } from '@/Components/Form/Btn';
import CatalogCard, { CatalogGrid, type CatalogAction, type CatalogLayout } from '@/Components/Surfaces/CatalogCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { LayoutGrid, List, Search } from 'lucide-react';
import { useState, type FormEventHandler, type ReactNode } from 'react';

const viewOptions: readonly ViewSwitchOption<CatalogLayout>[] = [
    { value: 'grid', label: 'Cuadrícula', icon: LayoutGrid },
    { value: 'list', label: 'Lista', icon: List },
];

export type CatalogItem = {
    key: string | number;
    title: string;
    lines: string[];
    actions?: CatalogAction[];
};

type Props = {
    children: ReactNode;
    onSearch: FormEventHandler<HTMLFormElement>;
    filterVariant?: 'default' | 'one';
    defaultLayout?: CatalogLayout;
    empty: ReactNode;
    items: CatalogItem[];
};

export default function Catalog({ children, onSearch, filterVariant = 'default', defaultLayout = 'list', empty, items }: Props) {
    const [layout, setLayout] = useState<CatalogLayout>(defaultLayout);

    return (
        <Results>
            <div data-band="" className="flex flex-col gap-[var(--space-sm)] md:flex-row md:items-end">
                <Filters variant={filterVariant} onSubmit={onSearch} className="min-w-0 md:w-auto md:min-w-0 md:flex-1">
                    {children}
                    <Btn type="submit" className="self-end">
                        <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Buscar
                    </Btn>
                </Filters>
                <ViewSwitch
                    className="shrink-0 max-md:hidden"
                    options={viewOptions}
                    defaultValue={defaultLayout}
                    value={layout}
                    onChange={setLayout}
                />
            </div>
            {items.length === 0 ? (
                <Empty>{empty}</Empty>
            ) : (
                <CatalogGrid layout={layout}>
                    {items.map((item) => (
                        <CatalogCard key={item.key} as="div" layout={layout} title={item.title} lines={item.lines} actions={item.actions} />
                    ))}
                </CatalogGrid>
            )}
        </Results>
    );
}

export type { CatalogAction, CatalogLayout };
