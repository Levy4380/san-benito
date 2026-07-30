import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { wallClockDateKey } from '@/lib/datetime';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function toDateKey(value: string | Date): string {
    if (typeof value === 'string') {
        return wallClockDateKey(value);
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

type AppointmentsCalendarProps = {
    /** YYYY-MM-DD keys that have appointments */
    markedDates: Set<string> | string[];
    onSelectDate: (dateKey: string) => void;
    selectedDate?: string | null;
    className?: string;
};

export function AppointmentsCalendar({
    markedDates,
    onSelectDate,
    selectedDate = null,
    className,
}: AppointmentsCalendarProps) {
    const marked = useMemo(
        () => (markedDates instanceof Set ? markedDates : new Set(markedDates)),
        [markedDates],
    );
    const [cursor, setCursor] = useState(() => {
        const base = selectedDate ? new Date(`${selectedDate}T12:00:00`) : new Date();
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const days = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: Array<{ key: string; day: number } | null> = [];

        for (let i = 0; i < startOffset; i++) {
            cells.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            cells.push({ key, day });
        }

        while (cells.length % 7 !== 0) {
            cells.push(null);
        }

        return cells;
    }, [year, month]);

    const monthLabel = cursor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const todayKey = toDateKey(new Date());

    return (
        <div
            className={cn(
                'w-full rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--card)] p-4 shadow-[0_1px_0_oklch(22%_0.02_255_/_0.04)]',
                className,
            )}
        >
            <div className="mb-4 flex items-center justify-between gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setCursor(new Date(year, month - 1, 1))}
                    aria-label="Mes anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-display text-[length:var(--text-md)] font-semibold capitalize tracking-tight">
                    {monthLabel}
                </h2>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setCursor(new Date(year, month + 1, 1))}
                    aria-label="Mes siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            <div className="mb-2 grid grid-cols-7 text-center text-[length:var(--text-xs)] font-semibold tracking-wide text-[var(--color-ink-2)] uppercase">
                {WEEKDAYS.map((label) => (
                    <div key={label} className="py-1">
                        {label}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((cell, index) => {
                    if (!cell) {
                        return <div key={`empty-${index}`} className="aspect-square min-h-10" />;
                    }

                    const hasItems = marked.has(cell.key);
                    const isSelected = selectedDate === cell.key;
                    const isToday = todayKey === cell.key;

                    return (
                        <button
                            key={cell.key}
                            type="button"
                            onClick={() => onSelectDate(cell.key)}
                            className={cn(
                                'relative flex aspect-square min-h-10 items-center justify-center rounded-[var(--radius-input)] text-[length:var(--text-sm)] transition-[background-color,color,transform] duration-[var(--dur-short)] ease-[var(--ease-out)]',
                                'hover:bg-[var(--color-paper-3)]',
                                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus)]',
                                'active:translate-y-px',
                                isSelected &&
                                    'bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:bg-[var(--color-accent)]',
                                !isSelected && isToday && 'ring-1 ring-[var(--color-accent)]',
                                !isSelected && hasItems && 'font-semibold text-[var(--color-ink)]',
                            )}
                        >
                            {cell.day}
                            {hasItems && (
                                <span
                                    className={cn(
                                        'absolute bottom-1.5 h-1.5 w-1.5 rounded-full',
                                        isSelected ? 'bg-[var(--color-accent-ink)]' : 'bg-[var(--color-accent)]',
                                    )}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
