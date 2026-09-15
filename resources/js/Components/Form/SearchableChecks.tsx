import Empty from '@/Components/Surfaces/Empty';
import TextInput from '@/Components/Form/TextInput';
import { Fragment, useMemo, useState, type ReactNode } from 'react';

type Named = {
    id: number;
    name: string;
};

type Props<T extends Named> = {
    items: T[];
    searchId: string;
    searchLabel: string;
    empty: ReactNode;
    emptyFiltered: ReactNode;
    children: (item: T) => ReactNode;
};

export default function SearchableChecks<T extends Named>({
    items,
    searchId,
    searchLabel,
    empty,
    emptyFiltered,
    children,
}: Props<T>) {
    const [query, setQuery] = useState('');
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return items;
        }

        return items.filter((item) => item.name.toLowerCase().includes(needle));
    }, [items, query]);

    if (items.length === 0) {
        return <Empty>{empty}</Empty>;
    }

    return (
        <div className="grid gap-2">
            <label className="sr-only" htmlFor={searchId}>
                {searchLabel}
            </label>
            <TextInput
                id={searchId}
                value={query}
                placeholder={searchLabel}
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                    }
                }}
            />
            {visible.length === 0 ? (
                <Empty>{emptyFiltered}</Empty>
            ) : (
                visible.map((item) => <Fragment key={item.id}>{children(item)}</Fragment>)
            )}
        </div>
    );
}
