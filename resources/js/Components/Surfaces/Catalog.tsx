import ViewSwitch, { type ViewSwitchOption } from '@/Components/Common/ViewSwitch';
import CatalogCard, { CatalogGrid, type CatalogAction, type CatalogLayout } from '@/Components/Surfaces/CatalogCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters, { type FilterValues } from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { LayoutGrid, List } from 'lucide-react';
import { useState, type ReactNode } from 'react';

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
    primary: ReactNode;
    advanced?: ReactNode;
    applied?: FilterValues;
    onApply: (data: FilterValues) => void;
    defaultLayout?: CatalogLayout;
    empty: ReactNode;
    items: CatalogItem[];
};

export default function Catalog({
    primary,
    advanced,
    applied,
    onApply,
    defaultLayout = 'list',
    empty,
    items,
}: Props) {
    const [layout, setLayout] = useState<CatalogLayout>(defaultLayout);

    return (
        <Results>
            <Filters
                primary={primary}
                advanced={advanced}
                applied={applied}
                onApply={onApply}
                listExtras={
                    <ViewSwitch
                        className="shrink-0 max-md:hidden"
                        options={viewOptions}
                        defaultValue={defaultLayout}
                        value={layout}
                        onChange={setLayout}
                    />
                }
            >
                {items.length === 0 ? (
                    <Empty>{empty}</Empty>
                ) : (
                    <CatalogGrid layout={layout}>
                        {items.map((item) => (
                            <CatalogCard key={item.key} as="div" layout={layout} title={item.title} lines={item.lines} actions={item.actions} />
                        ))}
                    </CatalogGrid>
                )}
            </Filters>
        </Results>
    );
}

export type { CatalogAction, CatalogLayout };
