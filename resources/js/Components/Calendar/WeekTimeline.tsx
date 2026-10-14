import { Btn } from '@/Components/Form/Btn';
import { pad2, wallDate, wallTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { AppointmentRecord } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

const DAY_START = 7 * 60;
const DAY_END = 21 * 60;
const DAY_MINUTES = 24 * 60;
const STEP = 60;

type Props = {
    today: string;
    now: string;
    appointments: AppointmentRecord[];
    onSelect: (id: number) => void;
};

type Block = {
    key: number;
    starts_at: string;
    ends_at: string;
    title: string;
    subtitle?: string | null;
    range: [number, number];
};

function addDays(dateKey: string, delta: number): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, (month ?? 1) - 1, (day ?? 1) + delta);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function minutesOf(value: string): number {
    const [hour, minute] = wallTime(value).split(':').map(Number);

    return (hour ?? 0) * 60 + (minute ?? 0);
}

function clipToDay(date: string, startsAt: string, endsAt: string): [number, number] {
    const start = wallDate(startsAt) < date ? 0 : minutesOf(startsAt);
    const end = wallDate(endsAt) > date ? DAY_MINUTES : minutesOf(endsAt);

    return [start, end];
}

function shortDayLabel(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, (month ?? 1) - 1, day).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
}

function rangeLabel(start: string, end: string): string {
    const startDate = wallParts(start);
    const endDate = wallParts(end);
    const day = (date: Date) => date.toLocaleDateString('es-AR', { day: 'numeric' });
    const month = (date: Date) => date.toLocaleDateString('es-AR', { month: 'short' });

    if (start === end) {
        return `${day(startDate)} ${month(startDate)} ${startDate.getFullYear()}`;
    }

    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return `${day(startDate)}–${day(endDate)} ${month(endDate)} ${endDate.getFullYear()}`;
    }

    return `${day(startDate)} ${month(startDate)} – ${day(endDate)} ${month(endDate)} ${endDate.getFullYear()}`;
}

function wallParts(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, (month ?? 1) - 1, day);
}

function visibleDayCount(width: number): number {
    if (width >= 960) {
        return 7;
    }
    if (width >= 760) {
        return 5;
    }
    if (width >= 560) {
        return 4;
    }

    return 2;
}

export function blocksOnDay(appointments: AppointmentRecord[], date: string) {
    return appointments
        .filter((appointment) => wallDate(appointment.starts_at) === date)
        .map((appointment) => ({
            key: appointment.id,
            starts_at: appointment.starts_at,
            ends_at: appointment.ends_at,
            title: appointment.professional?.user.name ?? '',
            subtitle: appointment.specialty?.name,
        }));
}

export default function WeekTimeline({ today, now, appointments, onSelect }: Props) {
    const todayKey = wallDate(today);
    const nowKey = wallDate(now);
    const frameRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scaleRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(7);
    const [start, setStart] = useState(todayKey);
    const days = Array.from({ length: visible }, (_, index) => addDays(start, index));
    const columns = days.map((date) => {
        const blocks: Block[] = blocksOnDay(appointments, date).map((block) => ({
            ...block,
            range: clipToDay(date, block.starts_at, block.ends_at),
        }));

        return { date, blocks };
    });
    const ranges = columns.flatMap((column) => column.blocks.map((block) => block.range));
    const firstHour = Math.floor(Math.min(DAY_START, ...ranges.map(([from]) => from)) / 60);
    const lastHour = Math.ceil(Math.max(DAY_END, ...ranges.map(([, to]) => to)) / 60);
    const span = (lastHour - firstHour) * 60;
    const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
    const top = (minutes: number) => `${((minutes - firstHour * 60) / span) * 100}%`;
    const height = (minutes: number) => `${(minutes / span) * 100}%`;
    const prevDisabled = start <= todayKey;
    const columnsTemplate = `var(--tl-gutter) repeat(${visible}, minmax(0, 1fr))`;

    useLayoutEffect(() => {
        const frame = frameRef.current;
        if (!frame) {
            return;
        }
        const apply = () => setVisible(visibleDayCount(frame.clientWidth));
        apply();
        const observer = new ResizeObserver(apply);
        observer.observe(frame);

        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        const scroll = scrollRef.current;
        if (!scroll) {
            return;
        }
        if (start !== todayKey || nowKey !== todayKey) {
            scroll.scrollTop = 0;

            return;
        }
        const scale = scaleRef.current;
        if (!scale) {
            return;
        }
        const minutes = Math.min(Math.max(minutesOf(now), firstHour * 60), lastHour * 60);
        const offset = ((Math.max(minutes - STEP, firstHour * 60) - firstHour * 60) / span) * scale.offsetHeight;
        scroll.scrollTop = scale.offsetTop + offset;
    }, [start, todayKey, now, nowKey, firstHour, lastHour, span, visible]);

    return (
        <div ref={frameRef} className="flex h-full min-h-0 flex-col gap-[var(--space-sm)]">
            <div className="flex shrink-0 items-center justify-between gap-[0.35rem]">
                <Btn
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Días anteriores"
                    disabled={prevDisabled}
                    onClick={() => setStart(addDays(start, -visible) < todayKey ? todayKey : addDays(start, -visible))}
                >
                    <ChevronLeft className="size-[1.35rem] shrink-0" aria-hidden strokeWidth={2} />
                </Btn>
                <h2 className="min-w-0 flex-1 text-center text-[length:var(--text-md)] leading-[1.2] capitalize">
                    {rangeLabel(days[0] ?? todayKey, days[days.length - 1] ?? todayKey)}
                </h2>
                <Btn
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Días siguientes"
                    onClick={() => setStart(addDays(start, visible))}
                >
                    <ChevronRight className="size-[1.35rem] shrink-0" aria-hidden strokeWidth={2} />
                </Btn>
            </div>
            <div className="timeline-wrap border-rule bg-paper flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card)] border">
                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid" style={{ gridTemplateColumns: columnsTemplate }} aria-label="Reservas por día y hora">
                        <div className="border-rule bg-paper sticky top-0 z-[1] border-b" />
                        {days.map((date) => (
                            <h3
                                key={date}
                                className={cn(
                                    'border-rule bg-paper sticky top-0 z-[1] truncate border-b border-l px-[0.35rem] py-[0.45rem] text-center text-sm leading-[1.2] font-medium capitalize',
                                    date === todayKey ? 'text-ink' : 'text-ink-2',
                                )}
                            >
                                {shortDayLabel(date)}
                            </h3>
                        ))}
                        <div ref={scaleRef} className="relative my-[0.7rem]" style={{ height: `calc(${span / STEP} * var(--tl-step-h))` }}>
                            {hours.map((hour) => (
                                <span
                                    key={hour}
                                    className="text-ink-2 absolute right-[0.35rem] font-mono text-[0.68rem] leading-none"
                                    style={{ top: `calc(${top(hour * 60)} - 0.34rem)` }}
                                >
                                    {pad2(hour)}:00
                                </span>
                            ))}
                        </div>
                        {columns.map((column) => {
                            const nowMin =
                                column.date === nowKey ? Math.min(Math.max(minutesOf(now), firstHour * 60), lastHour * 60) : firstHour * 60;

                            return (
                                <div
                                    key={column.date}
                                    className="border-rule relative my-[0.7rem] border-l"
                                    style={{ height: `calc(${span / STEP} * var(--tl-step-h))` }}
                                >
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className="border-rule absolute right-0 left-0 border-t border-dashed"
                                            style={{ top: top(hour * 60) }}
                                        />
                                    ))}
                                    {nowMin > firstHour * 60 ? (
                                        <div
                                            className="pointer-events-none absolute inset-x-0 top-0 bg-[repeating-linear-gradient(-45deg,var(--tl-past-stripe)_0_6px,transparent_6px_12px)]"
                                            style={{ height: height(nowMin - firstHour * 60) }}
                                        />
                                    ) : null}
                                    {column.blocks.map((block) => {
                                        const [from, to] = block.range;
                                        if (to <= from) {
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={block.key}
                                                type="button"
                                                onClick={() => onSelect(block.key)}
                                                className={cn(
                                                    'focus-visible:outline-focus absolute right-[0] left-[0] block min-h-[1.1rem] cursor-pointer overflow-hidden rounded-[1px] border px-[0.45rem] py-[0.2rem] text-left text-[length:var(--text-xs)] leading-[1.25] outline-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid',
                                                    now && block.ends_at <= now
                                                        ? 'border-rule text-ink-2 bg-[var(--tl-done-bg)]'
                                                        : 'border-[var(--tl-busy-border)] bg-[var(--tl-busy-bg)] text-[var(--tl-busy-ink)]',
                                                )}
                                                style={{ top: top(from), height: `calc(${height(to - from)} - 2px)` }}
                                            >
                                                <strong className="font-mono">
                                                    {wallTime(block.starts_at)}–{wallTime(block.ends_at)}
                                                </strong>{' '}
                                                {block.subtitle ? `${block.title} · ${block.subtitle}` : block.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
