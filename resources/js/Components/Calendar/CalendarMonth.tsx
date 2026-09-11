import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PointerEvent, useRef } from 'react';
import { Btn } from '@/Components/Form/Btn';
import CalendarDay from '@/Components/Calendar/CalendarDay';
import CalendarLegendSwatch from '@/Components/Calendar/CalendarLegendSwatch';
import { addMonths, isWeekendKey, lastDateOfMonth, monthGrid, monthTitle } from '@/lib/datetime';

const WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

type Tone = 'empty' | 'has' | 'full';

export type CalLegendItem = { tone: Tone | 'selected'; label: string };

type Props = {
    month: string;
    selected?: string | null;
    tones?: Record<string, Tone>;
    onSelect?: (date: string) => void;
    onPaint?: (date: string, selected: boolean) => void;
    onMonthChange: (month: string) => void;
    paint?: boolean;
    selectedDates?: string[];
    blockWeekends?: boolean;
    minDate?: string;
    legend?: CalLegendItem[];
};

export default function CalendarMonth({
    month,
    selected,
    tones,
    onSelect,
    onPaint,
    onMonthChange,
    paint,
    selectedDates,
    blockWeekends,
    minDate,
    legend,
}: Props) {
    const days = monthGrid(month);
    const prevDisabled = Boolean(minDate && lastDateOfMonth(addMonths(month, -1)) < minDate);
    const painting = useRef<boolean | null>(null);
    const selectedRef = useRef(selectedDates);
    const paintRef = useRef(onPaint);
    selectedRef.current = selectedDates;
    paintRef.current = onPaint;

    const applyPaint = (key: string, on: boolean) => {
        paintRef.current?.(key, on);
    };

    const dayFromPoint = (x: number, y: number) => {
        const el = document.elementFromPoint(x, y);

        return el?.closest<HTMLButtonElement>('[data-day]') ?? null;
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (!paint || event.button !== 0) {
            return;
        }
        const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-day]');
        if (!btn || btn.disabled) {
            return;
        }
        event.preventDefault();
        const key = btn.dataset.day;
        if (!key) {
            return;
        }
        const on = !(selectedRef.current ?? []).includes(key);
        painting.current = on;
        applyPaint(key, on);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (painting.current === null) {
            return;
        }
        const btn = dayFromPoint(event.clientX, event.clientY);
        if (btn && !btn.disabled && btn.dataset.day) {
            applyPaint(btn.dataset.day, painting.current);
        }
    };

    const endPaint = () => {
        painting.current = null;
    };

    return (
        <div className="@container flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-rule bg-paper p-[var(--space-2xs)] [container-type:size] md:p-[var(--space-sm)] max-md:rounded-[calc(var(--radius-card)+2px)]">
            <div className="mb-[var(--space-2xs)] flex shrink-0 items-center justify-between gap-[0.35rem]">
                <Btn
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Mes anterior"
                    disabled={prevDisabled}
                    onClick={() => onMonthChange(addMonths(month, -1))}
                >
                    <ChevronLeft className="size-[1.35rem] shrink-0" aria-hidden strokeWidth={2} />
                </Btn>
                <h2 className="min-w-0 flex-1 text-center leading-[1.2] capitalize text-[clamp(0.75rem,6.5cqh,var(--text-md))]">
                    {monthTitle(month)}
                </h2>
                <Btn
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Mes siguiente"
                    onClick={() => onMonthChange(addMonths(month, 1))}
                >
                    <ChevronRight className="size-[1.35rem] shrink-0" aria-hidden strokeWidth={2} />
                </Btn>
            </div>
            <div
                className={`grid min-h-0 flex-1 grid-cols-7 items-stretch justify-items-stretch gap-[clamp(0.12rem,1.2cqh,0.35rem)] [grid-template-rows:auto_repeat(6,minmax(0,1fr))]${paint ? ' touch-none select-none' : ''}`}
                onPointerDown={paint ? onPointerDown : undefined}
                onPointerMove={paint ? onPointerMove : undefined}
                onPointerUp={paint ? endPaint : undefined}
                onPointerCancel={paint ? endPaint : undefined}
                onLostPointerCapture={paint ? endPaint : undefined}
            >
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="flex w-full min-h-0 items-center justify-center py-[0.15rem] font-sans text-[0.65rem] font-medium leading-none tracking-normal text-ink-2 uppercase"
                    >
                        {day}
                    </div>
                ))}
                {days.map((day) => {
                    const tone = tones?.[day.key] ?? 'empty';
                    const blocked = Boolean(blockWeekends && isWeekendKey(day.key));
                    const isPast = Boolean(minDate && day.key < minDate);
                    const isMuted = !day.inMonth || blocked || isPast;
                    const isSelected = !isMuted && (selected === day.key || Boolean(selectedDates?.includes(day.key)));

                    return (
                        <CalendarDay
                            key={day.key}
                            day={day}
                            tone={tone}
                            selected={isSelected}
                            muted={isMuted}
                            disabled={isMuted}
                            paint={paint}
                            onClick={() => {
                                if (paint || isMuted) {
                                    return;
                                }
                                onSelect?.(day.key);
                            }}
                        />
                    );
                })}
            </div>
            {legend && legend.length > 0 ? (
                <div className="mt-[0.35rem] flex shrink-0 flex-wrap items-center gap-x-[0.55rem] gap-y-[0.2rem] text-[0.65rem] leading-[1.2] text-ink-2">
                    {legend.map((item) => (
                        <span key={item.tone} className="inline-flex max-w-none shrink-0 items-center gap-1">
                            <CalendarLegendSwatch tone={item.tone} /> {item.label}
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
