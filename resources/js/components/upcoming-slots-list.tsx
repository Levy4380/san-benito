import { formatWallClockTime, wallClockToLocalDate } from '@/lib/datetime';
import { cn } from '@/lib/utils';

type UpcomingItem = {
    id: number;
    starts_at: string;
    ends_at?: string;
    subtitle?: string;
};

type UpcomingSlotsListProps = {
    title?: string;
    items: UpcomingItem[];
    emptyMessage: string;
    onSelect: (startsAt: string) => void;
    className?: string;
};

function formatShortDate(startsAt: string): string {
    const date = wallClockToLocalDate(startsAt);

    return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export function UpcomingSlotsList({
    title = 'Turnos próximos',
    items,
    emptyMessage,
    onSelect,
    className,
}: UpcomingSlotsListProps) {
    return (
        <section className={cn('surface', className)}>
            <h2 className="font-display text-[length:var(--text-lg)]">{title}</h2>
            {items.length === 0 ? (
                <p className="mt-3 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">{emptyMessage}</p>
            ) : (
                <ul className="mt-3 divide-y divide-[var(--color-rule)]">
                    {items.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(item.starts_at)}
                                className="flex w-full flex-col gap-0.5 py-3 text-left transition-colors hover:text-[var(--color-accent)]"
                            >
                                <span className="font-display text-[length:var(--text-md)]">
                                    {formatShortDate(item.starts_at)} · {formatWallClockTime(item.starts_at)}
                                    {item.ends_at ? ` — ${formatWallClockTime(item.ends_at)}` : ''}
                                </span>
                                {item.subtitle ? (
                                    <span className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                        {item.subtitle}
                                    </span>
                                ) : null}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function takeNextUpcoming<T extends { starts_at: string }>(items: T[], limit = 5): T[] {
    const now = Date.now();

    return [...items]
        .filter((item) => wallClockToLocalDate(item.starts_at).getTime() > now)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
        .slice(0, limit);
}
