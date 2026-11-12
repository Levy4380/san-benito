import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import Time24 from '@/Components/Form/Time24';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import SurgeryDetailDialog from '@/Components/Surgeries/SurgeryDetailDialog';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import Panel from '@/Components/Surfaces/Panel';
import { clockMinutes, useClinic } from '@/lib/clinic';
import { formatDateLabel, pad2 } from '@/lib/datetime';
import { surgeryRange } from '@/lib/surgery';
import { cn } from '@/lib/utils';
import type { SurgeryRecord, SurgerySection } from '@/types';
import { Head, router } from '@inertiajs/react';
import { type CSSProperties, useRef, useState } from 'react';

type Suggestion = { starts_at: string; ends_at: string };

type Props = {
    date: string;
    month: string;
    today: string;
    now: string;
    from: SurgerySection;
    scheduling: boolean;
    surgery: SurgeryRecord | null;
    suggestion: Suggestion | null;
    gaps: Array<[number, number]>;
    tones: Record<string, 'empty' | 'has' | 'full'>;
    daySurgeries: SurgeryRecord[];
};

export default function AdminSurgeryCalendar({ date, month, today, now, from, scheduling, surgery, suggestion, gaps, tones, daySurgeries }: Props) {
    const [mobileDayOpen, setMobileDayOpen] = useState(false);
    const [openId, setOpenId] = useState<number | null>(null);
    const [start, setStart] = useState(suggestion?.starts_at ?? '');
    const [end, setEnd] = useState(suggestion?.ends_at ?? '');
    const seenDate = useRef(date);
    const { ask, dialog } = useConfirm();

    if (seenDate.current !== date) {
        seenDate.current = date;
        setStart(suggestion?.starts_at ?? '');
        setEnd(suggestion?.ends_at ?? '');
    }

    const visit = (next: { date?: string; month?: string }) => {
        const path = scheduling && surgery ? `/admin/cirugias/${surgery.id}/programar` : '/admin/cirugias/calendario';
        router.get(
            path,
            { date: next.date ?? date, month: next.month ?? month, from },
            { preserveState: true, preserveScroll: true },
        );
    };

    const check = scheduling ? scheduleCheck(date, start, end, now, daySurgeries) : null;
    const openSurgery = daySurgeries.find((item) => item.id === openId) ?? null;
    const panelTitle = capitalize(formatDateLabel(date));
    const subtitle = scheduling && surgery ? (
        <>
            <strong>Programar: {surgery.patient?.name}</strong>
            {` · Solicita ${surgery.professional?.user.name}. Elegí un día y un horario libre.`}
        </>
    ) : (
        'Calendario de cirugías programadas.'
    );

    const calendar = (
        <CalendarMonth
            month={month}
            selected={date}
            tones={tones}
            today={today}
            minDate={scheduling ? today : undefined}
            onSelect={(next) => {
                setMobileDayOpen(true);
                visit({ date: next, month: `${next.slice(0, 7)}-01` });
            }}
            onMonthChange={(next) => visit({ month: next })}
            legend={[
                { tone: 'empty', label: 'Sin cirugías' },
                { tone: 'has', label: 'Con cirugías' },
                { tone: 'full', label: '3 o más' },
            ]}
        />
    );

    const panel = (
        <Panel title={panelTitle} className="h-full min-h-0 gap-[var(--space-sm)]">
            <p className="m-0 text-sm text-ink-2">
                {daySurgeries.length === 1 ? '1 cirugía programada.' : `${daySurgeries.length} cirugías programadas.`}
            </p>
            {scheduling && surgery && check ? (
                <ScheduleControls
                    date={date}
                    start={start}
                    end={end}
                    check={check}
                    gaps={gaps}
                    onStart={(value) => {
                        const keep = start !== '' && end !== '' ? Math.max(toMinutes(end) - toMinutes(start), 30) : 60;
                        setStart(value);
                        setEnd(fromMinutes(toMinutes(value) + keep));
                    }}
                    onEnd={setEnd}
                    onGap={(fromMinute, toMinute) => {
                        const duration = Math.max(toMinutes(end) - toMinutes(start), 30);
                        setStart(fromMinutes(fromMinute));
                        setEnd(fromMinutes(Math.min(fromMinute + duration, toMinute)));
                    }}
                    onCancel={() => router.visit(`/admin/cirugias?section=${from}&surgery=${surgery.id}`)}
                    onSubmit={() => {
                        if (!check.ok) {
                            return;
                        }

                        router.post(`/admin/cirugias/${surgery.id}/programar`, {
                            starts_at: `${date} ${start}:00`,
                            ends_at: `${date} ${end}:00`,
                        });
                    }}
                />
            ) : null}
            <SurgeryTimeline
                date={date}
                now={now}
                surgeries={daySurgeries}
                preview={scheduling && start !== '' && end !== '' && check ? { start, end, ok: check.ok } : null}
                onOpen={scheduling ? undefined : setOpenId}
            />
        </Panel>
    );

    return (
        <>
            <Head title="Cirugías" />
            <PageScreen
                layout="split"
                header={
                    <PageHeader
                        title="Cirugías"
                        description={subtitle}
                        backHref={`/admin/cirugias?section=${from}`}
                        backLabel="Cirugías"
                    />
                }
            >
                <StageCard id="surgery-calendar">
                    <MobileDaySwap dayOpen={mobileDayOpen} onBackToCalendar={() => setMobileDayOpen(false)} calendar={calendar} panel={panel} />
                    <StageCard layout="split" className="max-md:!hidden">
                        {calendar}
                        {panel}
                    </StageCard>
                </StageCard>
            </PageScreen>
            {openSurgery ? (
                <SurgeryDetailDialog
                    surgery={openSurgery}
                    section={from}
                    onDismiss={() => setOpenId(null)}
                    onApprove={async (item) => {
                        setOpenId(null);
                        const ok = await ask({
                            title: 'Aprobar cirugía',
                            message: 'Pasa a «A programar» y sigue sin horario.',
                            confirmLabel: 'Aprobar',
                        });
                        if (ok) {
                            router.post(`/admin/cirugias/${item.id}/aprobar`, {}, { preserveState: false });
                        }
                    }}
                />
            ) : null}
            {dialog}
        </>
    );
}

function ScheduleControls({
    start,
    end,
    check,
    gaps,
    onStart,
    onEnd,
    onGap,
    onCancel,
    onSubmit,
}: {
    start: string;
    end: string;
    check: { ok: boolean; message: string };
    gaps: Array<[number, number]>;
    onStart: (value: string) => void;
    onEnd: (value: string) => void;
    onGap: (from: number, to: number) => void;
    onCancel: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="grid gap-[var(--space-sm)]">
            <div className="flex flex-wrap gap-[var(--space-sm)]">
                <Field label="Hora de inicio" htmlFor="schedule-start" flush>
                    <Time24 id="schedule-start" value={start} onChange={onStart} blank={start === ''} />
                </Field>
                <Field label="Hora de fin" htmlFor="schedule-end" flush>
                    <Time24 id="schedule-end" value={end} onChange={onEnd} blank={end === ''} />
                </Field>
            </div>
            <p className={cn('m-0 text-sm', check.ok ? 'text-[oklch(36%_0.1_150)]' : 'text-[oklch(42%_0.14_25)]')} role="status">
                {check.message}
            </p>
            <Field label="Huecos libres" flush>
                {gaps.length === 0 ? (
                    <p className="m-0 text-sm text-ink-2">No quedan huecos libres de 30 min o más este día.</p>
                ) : (
                    <div className="flex flex-wrap gap-[0.35rem]">
                        {gaps.map(([from, to]) => (
                            <Btn key={`${from}-${to}`} type="button" variant="outline" size="sm" onClick={() => onGap(from, to)}>
                                {fromMinutes(from)}–{fromMinutes(to)}
                            </Btn>
                        ))}
                    </div>
                )}
            </Field>
            <div className="flex flex-wrap justify-end gap-[var(--space-sm)]">
                <Btn type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Btn>
                <Btn type="button" disabled={!check.ok} onClick={onSubmit}>
                    Programar
                </Btn>
            </div>
        </div>
    );
}

function SurgeryTimeline({
    date,
    now,
    surgeries,
    preview,
    onOpen,
}: {
    date: string;
    now: string;
    surgeries: SurgeryRecord[];
    preview: { start: string; end: string; ok: boolean } | null;
    onOpen?: (id: number) => void;
}) {
    const clinic = useClinic();
    const dayStart = clockMinutes(clinic.opensAt);
    const dayEnd = clockMinutes(clinic.closesAt);
    const previewStart = preview ? toMinutes(preview.start) : null;
    const previewEnd = preview ? toMinutes(preview.end) : null;
    const busyMinutes = surgeries.flatMap((surgery) =>
        surgery.starts_at && surgery.ends_at ? [toMinutes(surgery.starts_at.slice(11, 16)), toMinutes(surgery.ends_at.slice(11, 16))] : [],
    );
    const firstHour = Math.floor(Math.min(dayStart, previewStart ?? dayStart, ...busyMinutes, dayStart) / 60);
    const lastHour = Math.ceil(Math.max(dayEnd, previewEnd ?? dayEnd, ...busyMinutes, dayEnd) / 60);
    const span = Math.max((lastHour - firstHour) * 60, 60);
    const top = (minutes: number) => `${((minutes - firstHour * 60) / span) * 100}%`;
    const height = (minutes: number) => `${(Math.max(minutes, 0) / span) * 100}%`;
    const nowMin = Math.min(nowMinutes(date, now), lastHour * 60);

    return (
        <div className="timeline-wrap border-rule bg-paper max-h-[34rem] min-h-[16rem] overflow-y-auto rounded-[var(--radius-card)] border py-[0.5rem] pr-[0.25rem]">
            <div
                className="timeline relative my-[0.4rem]"
                style={{ height: `${(lastHour - firstHour) * 3}rem` } as CSSProperties}
                aria-label="Cirugías del día por hora"
            >
                {Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index).map((hour) => (
                    <div key={hour} className="tl-hour border-rule absolute right-0 left-[var(--tl-gutter)] border-t border-dashed" style={{ top: top(hour * 60) }}>
                        <span className="text-ink-2 absolute top-[-0.5rem] left-[-3rem] font-mono text-[0.68rem] leading-none">{pad2(hour)}:00</span>
                    </div>
                ))}
                {nowMin > firstHour * 60 ? (
                    <div
                        className="tl-past pointer-events-none absolute top-0 right-0 left-[var(--tl-gutter)] bg-[repeating-linear-gradient(-45deg,var(--tl-past-stripe)_0_6px,transparent_6px_12px)]"
                        style={{ height: height(nowMin - firstHour * 60) }}
                    />
                ) : null}
                {surgeries.map((surgery) => {
                    if (!surgery.starts_at || !surgery.ends_at) {
                        return null;
                    }

                    const startMin = toMinutes(surgery.starts_at.slice(11, 16));
                    const endMin = toMinutes(surgery.ends_at.slice(11, 16));
                    const Tag = onOpen ? 'button' : 'div';

                    return (
                        <Tag
                            key={surgery.id}
                            {...(onOpen ? { type: 'button' as const, onClick: () => onOpen(surgery.id) } : {})}
                            className={cn(
                                'absolute right-[0.35rem] left-[var(--tl-inset)] overflow-hidden rounded-[var(--radius-input)] border px-[0.45rem] py-[0.2rem] text-left text-[length:var(--text-xs)] leading-[1.25]',
                                surgery.ends_at <= now
                                    ? 'border-rule text-ink-2 bg-[var(--tl-done-bg)]'
                                    : 'border-[var(--tl-busy-border)] bg-[var(--tl-busy-bg)] text-[var(--tl-busy-ink)]',
                                onOpen && 'cursor-pointer',
                            )}
                            style={{ top: top(startMin), height: `calc(${height(endMin - startMin)} - 2px)` }}
                        >
                            <strong className="font-mono">{surgeryRange(surgery.starts_at, surgery.ends_at)}</strong>{' '}
                            {surgery.patient?.name} · {surgery.professional?.user.name}
                        </Tag>
                    );
                })}
                {preview && previewEnd !== null && previewStart !== null && previewEnd > previewStart ? (
                    <div
                        className={cn(
                            'pointer-events-none absolute right-[0.35rem] left-[var(--tl-inset)] overflow-hidden rounded-[var(--radius-input)] border px-[0.45rem] py-[0.2rem] text-left text-[length:var(--text-xs)] leading-[1.25]',
                            preview.ok
                                ? 'border-[oklch(40%_0.12_150)] bg-[oklch(90%_0.08_150)] text-[oklch(30%_0.08_150)]'
                                : 'border-[oklch(45%_0.16_25)] bg-[oklch(92%_0.06_25)] text-[oklch(38%_0.12_25)]',
                        )}
                        style={{ top: top(previewStart), height: height(previewEnd - previewStart) }}
                    >
                        <strong className="font-mono">
                            {preview.start}–{preview.end}
                        </strong>{' '}
                        Esta cirugía
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function scheduleCheck(date: string, start: string, end: string, now: string, busy: SurgeryRecord[]): { ok: boolean; message: string } {
    if (start === '' || end === '') {
        return { ok: false, message: 'Elegí la hora de inicio y de fin.' };
    }

    const startMin = toMinutes(start);
    const endMin = toMinutes(end);

    if (endMin <= startMin) {
        return { ok: false, message: 'La hora de fin tiene que ser posterior a la de inicio.' };
    }

    if (endMin - startMin < 30) {
        return { ok: false, message: 'La cirugía tiene que durar al menos 30 minutos.' };
    }

    if (`${date} ${start}:00` <= now) {
        return { ok: false, message: 'Ese horario ya pasó. Programá un horario futuro.' };
    }

    const startStamp = `${date} ${start}:00`;
    const endStamp = `${date} ${end}:00`;
    const clash = busy.find(
        (other) => other.starts_at !== null && other.ends_at !== null && other.starts_at < endStamp && startStamp < other.ends_at,
    );

    if (clash?.starts_at && clash.ends_at) {
        return { ok: false, message: `Se solapa con ${surgeryRange(clash.starts_at, clash.ends_at)} (${clash.patient?.name}).` };
    }

    return { ok: true, message: `Libre · ${endMin - startMin} min.` };
}

function toMinutes(time: string): number {
    const [hour, minute] = time.split(':').map(Number);

    return (hour ?? 0) * 60 + (minute ?? 0);
}

function fromMinutes(total: number): string {
    const clamped = Math.max(0, Math.min(total, 23 * 60 + 55));

    return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

function nowMinutes(date: string, now: string): number {
    if (date < now.slice(0, 10)) {
        return 24 * 60;
    }

    if (date > now.slice(0, 10)) {
        return 0;
    }

    return toMinutes(now.slice(11, 16));
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
