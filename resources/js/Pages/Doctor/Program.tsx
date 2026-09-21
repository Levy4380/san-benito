import { Head, useForm } from '@inertiajs/react';
import { CalendarCheck, Check, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import StepPills from '@/Components/Common/StepPills';
import WizardStickyCta, { WizardStickyAction } from '@/Components/Common/WizardStickyCta';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Empty from '@/Components/Surfaces/Empty';
import Field from '@/Components/Form/Field';
import Hint from '@/Components/Surfaces/Hint';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import Results from '@/Components/Surfaces/Results';
import SlotRow from '@/Components/Surfaces/SlotRow';
import Time24 from '@/Components/Form/Time24';
import { formatDateLabel, isWeekendKey, minutesBetween, todayKey, weekdayKeysOfMonth } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { DoctorRecord } from '@/types';

type Range = { start: string; end: string };
type Tone = 'empty' | 'has' | 'full';

type Props = {
    doctor: DoctorRecord;
    tones: Record<string, Tone>;
};

const PROGRAM_LEGEND = [
    { tone: 'empty' as const, label: 'Sin turnos' },
    { tone: 'has' as const, label: 'Con turnos libres' },
    { tone: 'full' as const, label: 'Todo reservado' },
    { tone: 'selected' as const, label: 'Seleccionado' },
];

export default function Program({ doctor, tones }: Props) {
    const [step, setStep] = useState<'when' | 'hours'>('when');
    const [month, setMonth] = useState(todayKey().slice(0, 7) + '-01');
    const [dates, setDates] = useState<string[]>([todayKey()]);
    const [blockWeekends, setBlockWeekends] = useState(false);
    const [start, setStart] = useState('09:00');
    const [end, setEnd] = useState('12:00');
    const [ranges, setRanges] = useState<Range[]>([]);
    const form = useForm({ dates, ranges, block_weekends: blockWeekends });
    const duration = doctor.slot_duration_minutes;

    const selectedDays = useMemo(() => {
        const keys = blockWeekends ? dates.filter((key) => !isWeekendKey(key)) : dates;

        return [...keys].sort();
    }, [dates, blockWeekends]);

    const paintDay = (key: string, on: boolean) => {
        if (on && blockWeekends && isWeekendKey(key)) {
            return;
        }
        setDates((current) => {
            const has = current.includes(key);
            if (on && !has) {
                return [...current, key];
            }
            if (!on && has) {
                return current.filter((item) => item !== key);
            }

            return current;
        });
    };

    const toggleWeekends = (checked: boolean) => {
        setBlockWeekends(checked);
        if (checked) {
            setDates((current) => {
                const next = current.filter((key) => !isWeekendKey(key));

                return next.length ? next : [todayKey()].filter((key) => !isWeekendKey(key));
            });
        }
    };

    const draftOk = Boolean(start && end && minutesBetween(start, end) >= duration);

    const addRange = () => {
        if (!draftOk) {
            return;
        }
        setRanges((current) => {
            if (current.some((range) => range.start === start && range.end === end)) {
                return current;
            }

            return [...current, { start, end }];
        });
    };

    const goHours = () => {
        if (selectedDays.length === 0) {
            return;
        }
        setStart('09:00');
        setEnd('12:00');
        setRanges([]);
        setStep('hours');
    };

    const selectWorkdaysOfMonth = () => {
        const keys = weekdayKeysOfMonth(month);
        if (keys.length === 0) {
            return;
        }
        setBlockWeekends(true);
        setDates(keys);
    };

    const submit = () => {
        if (ranges.length === 0) {
            return;
        }
        form.transform(() => ({ dates: selectedDays, ranges, block_weekends: blockWeekends }));
        form.post('/agenda/program');
    };

    const countLabel =
        selectedDays.length === 1 ? `1 día · ${formatDateLabel(selectedDays[0])}` : `${selectedDays.length} días seleccionados.`;

    const hoursMeta =
        selectedDays.length === 1
            ? `${formatDateLabel(selectedDays[0])} · turnos de ${duration} min`
            : `${selectedDays.length} días · turnos de ${duration} min`;

    const renderCalendar = () => (
        <CalendarMonth
            month={month}
            selectedDates={selectedDays}
            tones={tones}
            paint
            blockWeekends={blockWeekends}
            onPaint={paintDay}
            onMonthChange={setMonth}
            legend={PROGRAM_LEGEND}
        />
    );

    return (
        <>
            <Head title="Programar turnos" />
            <PageScreen
                header={
                    <PageHeader
                        title="Programar turnos"
                        backLabel="Atrás"
                        onBack={step === 'hours' ? () => setStep('when') : undefined}
                        steps={<StepPills steps={[{ key: 'when', label: 'Cuándo' }, { key: 'hours', label: 'Horario' }]} current={step} />}
                    />
                }
            >
                <StageCard id="program-body">
                    {step === 'when' ? (
                        <>
                            {/* Phone: cal + toolbar + sticky Continuar (no agenda sheet) */}
                            <div className="relative flex h-full min-h-0 flex-1 flex-col gap-[0.35rem] overflow-hidden md:hidden">
                                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">{renderCalendar()}</div>
                                <WhenToolbar
                                    compact
                                    blockWeekends={blockWeekends}
                                    onToggleWeekends={toggleWeekends}
                                    onReset={() => setDates([todayKey()])}
                                    onSelectWorkdays={selectWorkdaysOfMonth}
                                />
                                <WizardStickyCta
                                    meta={
                                        selectedDays.length === 0
                                            ? 'Elegí un día.'
                                            : selectedDays.length === 1
                                              ? '1 día'
                                              : `${selectedDays.length} días`
                                    }
                                >
                                    <WizardStickyAction disabled={selectedDays.length === 0} onClick={goHours}>
                                        Continuar
                                        <ChevronRight className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    </WizardStickyAction>
                                </WizardStickyCta>
                            </div>

                            {/* md+: split cal | panel (no sheet) */}
                            <StageCard layout="split" className="max-md:!hidden">
                                {renderCalendar()}
                                <Panel title="Elegí los días" className="gap-0">
                                    <Hint id="program-when-hint" className="m-0 max-w-none text-left">
                                        Podés seleccionar hoy, un día o arrastrar varios.
                                    </Hint>
                                    {selectedDays.length > 0 ? (
                                        <Hint id="program-when-count" className="m-0 max-w-none text-left">
                                            {countLabel}
                                        </Hint>
                                    ) : null}
                                    <PanelScroll className="items-start justify-items-start gap-[var(--space-sm)]">
                                        <WhenToolbar
                                            blockWeekends={blockWeekends}
                                            onToggleWeekends={toggleWeekends}
                                            onReset={() => setDates([todayKey()])}
                                            onSelectWorkdays={selectWorkdaysOfMonth}
                                        />
                                    </PanelScroll>
                                    <WizardStickyCta variant="panel" meta={selectedDays.length > 0 ? countLabel : undefined}>
                                        <WizardStickyAction disabled={selectedDays.length === 0} onClick={goHours}>
                                            Continuar
                                            <ChevronRight className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        </WizardStickyAction>
                                    </WizardStickyCta>
                                </Panel>
                            </StageCard>
                        </>
                    ) : (
                        <Results className="relative gap-[var(--space-md)] pb-[calc(var(--control-h)+1.75rem)]">
                            <Hint className="m-0 shrink-0">{hoursMeta}</Hint>
                            <div className="grid w-full gap-[var(--space-md)] sm:grid-cols-2">
                                <Field label="Hora de inicio" htmlFor="program-start-h" flush>
                                    <Time24 id="program-start" value={start} onChange={setStart} />
                                </Field>
                                <Field label="Hora de finalización" htmlFor="program-end-h" flush>
                                    <Time24 id="program-end" value={end} onChange={setEnd} />
                                </Field>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-[0.5rem]">
                                <Btn type="button" variant="outline" disabled={!draftOk} onClick={addRange}>
                                    <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Agregar franja
                                </Btn>
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col gap-[0.5rem] overflow-auto">
                                {ranges.length === 0 ? (
                                    <Empty className="m-0">Todavía no agregaste franjas.</Empty>
                                ) : (
                                    <>
                                        <h2 className="m-0 text-[length:var(--text-md)]">Franjas</h2>
                                        {ranges.map((range, index) => (
                                            <SlotRow key={`${range.start}-${range.end}-${index}`}>
                                                <p className="min-w-0 flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                                                    <span className="font-mono font-medium">
                                                        {range.start} — {range.end}
                                                    </span>
                                                    <span className="text-ink-2">
                                                        {' '}
                                                        · {selectedDays.length} día{selectedDays.length === 1 ? '' : 's'}
                                                    </span>
                                                </p>
                                                <Btn
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0"
                                                    onClick={() => setRanges((current) => current.filter((_, i) => i !== index))}
                                                >
                                                    <Minus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Quitar
                                                </Btn>
                                            </SlotRow>
                                        ))}
                                    </>
                                )}
                            </div>
                            {Object.values(form.errors).length > 0 ? (
                                <Empty className="m-0" role="alert">
                                    {Object.values(form.errors).join(' ')}
                                </Empty>
                            ) : null}
                            <WizardStickyCta
                                className="absolute right-0 bottom-0 left-0 mx-0 rounded-b-lg px-[var(--space-md)] max-md:px-[var(--space-sm)]"
                                meta={ranges.length === 0 ? 'Agregá al menos una franja.' : `${ranges.length} franja${ranges.length === 1 ? '' : 's'} · N×M`}
                            >
                                <WizardStickyAction onClick={submit} disabled={form.processing || ranges.length === 0}>
                                    <Check className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Listo
                                </WizardStickyAction>
                            </WizardStickyCta>
                        </Results>
                    )}
                </StageCard>
            </PageScreen>
        </>
    );
}

function WhenToolbar({
    blockWeekends,
    onToggleWeekends,
    onReset,
    onSelectWorkdays,
    compact = false,
}: {
    blockWeekends: boolean;
    onToggleWeekends: (checked: boolean) => void;
    onReset: () => void;
    onSelectWorkdays: () => void;
    compact?: boolean;
}) {
    return (
        <div className={cn('flex w-full flex-col gap-[var(--space-xs)]', compact && 'shrink-0 gap-[0.35rem]')}>
            <CheckLabel checked={blockWeekends} onChange={onToggleWeekends} className="justify-start text-left max-md:text-xs">
                Bloquear fines de semana
            </CheckLabel>
            <div className={cn('flex flex-wrap items-center gap-[0.5rem]', compact && 'flex-nowrap gap-[0.35rem]')}>
                <Btn
                    type="button"
                    variant="outline"
                    size={compact ? 'icon' : 'sm'}
                    onClick={onReset}
                    aria-label="Reset"
                    className={compact ? 'shrink-0' : undefined}
                >
                    <RotateCcw className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    {compact ? null : 'Reset'}
                </Btn>
                <Btn
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-auto min-h-[var(--control-h-sm)] max-w-full py-[0.35rem] text-left leading-[1.25] whitespace-normal',
                        compact && 'min-w-0 flex-1 justify-center py-[0.45rem] text-center',
                    )}
                    onClick={onSelectWorkdays}
                >
                    <CalendarCheck className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    {compact ? 'Días hábiles del mes' : 'Seleccionar todos los días hábiles del mes'}
                </Btn>
            </div>
        </div>
    );
}
