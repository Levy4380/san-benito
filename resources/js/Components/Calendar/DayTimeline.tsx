import { pad2, wallDate, wallTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';

const DAY_START = 7 * 60;
const DAY_END = 21 * 60;
const DAY_MINUTES = 24 * 60;

export type DayTimelineBand = { key: string | number; starts_at: string; ends_at: string };

export type DayTimelineBlock = DayTimelineBand & { title: string; subtitle?: string | null };

type Props = {
    /** Y-m-d (institutional wall date) */
    date: string;
    /** Y-m-d H:i:s from the server; never the browser clock (d17). Omit to skip the past shading. */
    now?: string;
    bands: DayTimelineBand[];
    blocks: DayTimelineBlock[];
    /** Minutes per row of fixed height (e.g. the doctor's slot duration) */
    stepMinutes?: number;
    className?: string;
    label?: string;
    onBlockSelect?: (key: DayTimelineBlock['key']) => void;
    /** Free calculated slots, rendered as «+ Asignar turno» when `onFreeSelect` is set */
    freeSlots?: { starts_at: string; ends_at: string }[];
    onFreeSelect?: (startsAt: string) => void;
    /** Drag to paint [start, end) minutes snapped to the step; `on` is false when the drag starts inside a band. */
    onPaint?: (start: number, end: number, on: boolean) => void;
};

type PaintDraft = { from: number; to: number; on: boolean };

function formatMinutes(minutes: number): string {
    return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
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

export default function DayTimeline({
    date,
    now,
    bands,
    blocks,
    stepMinutes = 60,
    className,
    label = 'Franjas y reservas del día por hora',
    onBlockSelect,
    freeSlots = [],
    onFreeSelect,
    onPaint,
}: Props) {
    const step = Math.max(5, Math.min(stepMinutes, 60));
    const wrapRef = useRef<HTMLDivElement>(null);
    const [paint, setPaint] = useState<PaintDraft | null>(null);
    const paintRef = useRef<PaintDraft | null>(null);
    const clippedBands = bands.map((band) => ({ band, range: clipToDay(date, band.starts_at, band.ends_at) }));
    const clippedBlocks = blocks.map((block) => ({ block, range: clipToDay(date, block.starts_at, block.ends_at) }));
    const ranges = [...clippedBands, ...clippedBlocks].map((item) => item.range);

    const firstHour = Math.floor(Math.min(DAY_START, ...ranges.map(([start]) => start)) / 60);
    const lastHour = Math.ceil(Math.max(DAY_END, ...ranges.map(([, end]) => end)) / 60);
    const span = (lastHour - firstHour) * 60;
    const top = (minutes: number) => `${((minutes - firstHour * 60) / span) * 100}%`;
    const height = (minutes: number) => `${(minutes / span) * 100}%`;
    const firstContent = Math.min(...ranges.map(([start]) => start), lastHour * 60);

    const today = now ? wallDate(now) : null;
    const nowMin = !now || !today ? 0 : date < today ? lastHour * 60 : date > today ? 0 : Math.min(minutesOf(now), lastHour * 60);

    /* H:i ranges can't end at 24:00 */
    const paintMaxEnd = lastHour * 60 >= DAY_MINUTES ? DAY_MINUTES - step : lastHour * 60;

    const minuteAt = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const raw = firstHour * 60 + ((event.clientY - rect.top) / rect.height) * span;
        const snapped = Math.floor(raw / step) * step;

        return Math.max(firstHour * 60, Math.min(snapped, paintMaxEnd - step));
    };

    const paintRange = (draft: PaintDraft): [number, number] => [Math.min(draft.from, draft.to), Math.max(draft.from, draft.to) + step];

    const updatePaint = (draft: PaintDraft | null) => {
        paintRef.current = draft;
        setPaint(draft);
    };

    const onPaintStart = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        const minute = minuteAt(event);
        const inside = clippedBands.some(({ range: [start, end] }) => minute >= start && minute < end);
        updatePaint({ from: minute, to: minute, on: !inside });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPaintMove = (event: PointerEvent<HTMLDivElement>) => {
        const draft = paintRef.current;
        if (!draft) {
            return;
        }
        const minute = minuteAt(event);
        if (minute !== draft.to) {
            updatePaint({ ...draft, to: minute });
        }
    };

    const onPaintEnd = () => {
        const draft = paintRef.current;
        if (!draft) {
            return;
        }
        updatePaint(null);
        const [start, end] = paintRange(draft);
        onPaint?.(start, end, draft.on);
    };

    const onPaintCancel = () => updatePaint(null);

    const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
    const steps =
        step < 60 && 60 % step === 0
            ? Array.from({ length: span / step }, (_, index) => firstHour * 60 + index * step).filter((minutes) => minutes % 60 !== 0)
            : [];

    useEffect(() => {
        const wrap = wrapRef.current;
        const timeline = wrap?.firstElementChild;
        if (!wrap || !(timeline instanceof HTMLElement)) {
            return;
        }
        const offset = ((Math.max(firstContent - step, firstHour * 60) - firstHour * 60) / span) * timeline.offsetHeight;
        wrap.scrollTop = offset;
    }, [date, firstContent, firstHour, span, step]);

    return (
        <div
            ref={wrapRef}
            className={cn(
                'timeline-wrap border-rule bg-paper max-h-[34rem] min-h-0 overflow-y-auto rounded-[var(--radius-card)] border py-[0.5rem] pr-[0.25rem]',
                className,
            )}
        >
            <div
                className="timeline relative my-[0.4rem] h-[calc(var(--steps)*var(--tl-step-h))]"
                style={{ '--steps': span / step } as CSSProperties}
                aria-label={label}
            >
                {steps.map((minutes) => (
                    <div
                        key={minutes}
                        className="tl-step border-rule/60 absolute right-0 left-[var(--tl-gutter)] border-t border-dotted"
                        style={{ top: top(minutes) }}
                    />
                ))}

                {hours.map((hour) => (
                    <div
                        key={hour}
                        className="tl-hour border-rule absolute right-0 left-[var(--tl-gutter)] border-t border-dashed"
                        style={{ top: top(hour * 60) }}
                    >
                        <span className="text-ink-2 absolute top-[-0.5rem] left-[-3rem] font-mono text-[0.68rem] leading-none">{pad2(hour)}:00</span>
                    </div>
                ))}

                {clippedBands.map(({ band, range: [start, end] }) =>
                    end > start ? (
                        <div
                            key={band.key}
                            className="tl-window text-ink-2 pointer-events-none absolute right-[0.35rem] left-[var(--tl-inset)] overflow-hidden rounded-[var(--radius-input)] bg-[var(--tl-window-bg)] px-[0.45rem] py-[0.15rem] text-right font-mono text-[0.62rem] leading-[1.2]"
                            style={{ top: top(start), height: height(end - start) }}
                        >
                            {formatMinutes(start)}–{end === DAY_MINUTES ? '24:00' : formatMinutes(end)}
                        </div>
                    ) : null,
                )}

                {onPaint ? (
                    <div
                        className="tl-paint absolute inset-y-0 right-0 left-[var(--tl-gutter)] cursor-crosshair touch-none select-none"
                        onPointerDown={onPaintStart}
                        onPointerMove={onPaintMove}
                        onPointerUp={onPaintEnd}
                        onPointerCancel={onPaintCancel}
                        onLostPointerCapture={onPaintEnd}
                    />
                ) : null}

                {paint
                    ? (() => {
                          const [start, end] = paintRange(paint);

                          return (
                              <div
                                  className={cn(
                                      'tl-paint-draft pointer-events-none absolute right-[0.35rem] left-[var(--tl-inset)] rounded-[var(--radius-input)] border border-dashed px-[0.45rem] py-[0.15rem] text-right font-mono text-[0.62rem] leading-[1.2]',
                                      paint.on
                                          ? 'border-accent text-accent bg-[var(--tl-paint-bg)]'
                                          : 'border-danger text-danger bg-[var(--tl-erase-bg)]',
                                  )}
                                  style={{ top: top(start), height: height(end - start) }}
                              >
                                  {formatMinutes(start)}–{formatMinutes(end)}
                              </div>
                          );
                      })()
                    : null}

                {nowMin > firstHour * 60 ? (
                    <div
                        className="tl-past pointer-events-none absolute top-0 right-0 left-[var(--tl-gutter)] bg-[repeating-linear-gradient(-45deg,var(--tl-past-stripe)_0_6px,transparent_6px_12px)]"
                        style={{ height: height(nowMin - firstHour * 60) }}
                    />
                ) : null}

                {onFreeSelect
                    ? freeSlots.map((slot) => {
                          const [start, end] = clipToDay(date, slot.starts_at, slot.ends_at);

                          return end > start ? (
                              <button
                                  key={slot.starts_at}
                                  type="button"
                                  onClick={() => onFreeSelect(slot.starts_at)}
                                  aria-label={`Asignar turno ${wallTime(slot.starts_at)}–${wallTime(slot.ends_at)}`}
                                  className="tl-block tl-free border-ink-2/40 text-ink-2 hover:bg-paper-2 hover:border-ink-2/70 hover:text-ink focus-visible:outline-focus absolute right-[0.35rem] left-[var(--tl-inset)] block min-h-[1.1rem] cursor-pointer overflow-hidden rounded-[var(--radius-input)] border border-dashed bg-transparent px-[0.45rem] py-[0.2rem] text-left text-[length:var(--text-xs)] leading-[1.25] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid"
                                  style={{ top: top(start), height: `calc(${height(end - start)} - 2px)` }}
                              >
                                  <strong className="font-mono">
                                      {wallTime(slot.starts_at)}–{wallTime(slot.ends_at)}
                                  </strong>{' '}
                                  + Asignar turno
                              </button>
                          ) : null;
                      })
                    : null}

                {clippedBlocks.map(({ block, range: [start, end] }) => {
                    const Tag = onBlockSelect ? 'button' : 'div';

                    return (
                        <Tag
                            key={block.key}
                            {...(onBlockSelect ? { type: 'button' as const, onClick: () => onBlockSelect(block.key) } : {})}
                            className={cn(
                                'tl-block tl-busy absolute right-[0.35rem] left-[var(--tl-inset)] block min-h-[1.1rem] overflow-hidden rounded-[var(--radius-input)] border px-[0.45rem] py-[0.2rem] text-left text-[length:var(--text-xs)] leading-[1.25]',
                                now && block.ends_at <= now
                                    ? 'is-done border-rule text-ink-2 bg-[var(--tl-done-bg)]'
                                    : 'border-[var(--tl-busy-border)] bg-[var(--tl-busy-bg)] text-[var(--tl-busy-ink)]',
                                onBlockSelect &&
                                    'focus-visible:outline-focus cursor-pointer outline-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid',
                            )}
                            style={{ top: top(start), height: `calc(${height(Math.max(end - start, 0))} - 2px)` }}
                        >
                            <strong className="font-mono">
                                {wallTime(block.starts_at)}–{wallTime(block.ends_at)}
                            </strong>{' '}
                            {block.subtitle ? `${block.title} · ${block.subtitle}` : block.title}
                        </Tag>
                    );
                })}
            </div>
        </div>
    );
}
