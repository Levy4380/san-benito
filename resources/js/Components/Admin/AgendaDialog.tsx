import CalendarMonth, { type CalLegendItem } from '@/Components/Calendar/CalendarMonth';
import DayTimeline from '@/Components/Calendar/DayTimeline';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Empty from '@/Components/Surfaces/Empty';
import Panel from '@/Components/Surfaces/Panel';
import { todayKey } from '@/lib/datetime';
import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type Props = {
    title: string;
    message?: string;
    onDismiss: () => void;
    failed: boolean;
    month: string;
    selected: string | null;
    tones: Record<string, 'empty' | 'has'>;
    today?: string;
    legend: CalLegendItem[];
    onSelect: (date: string) => void;
    onMonthChange: (month: string) => void;
    panelTitle?: string;
    panel: ReactNode;
};

export default function AgendaDialog({
    title,
    message,
    onDismiss,
    failed,
    month,
    selected,
    tones,
    today,
    legend,
    onSelect,
    onMonthChange,
    panelTitle,
    panel,
}: Props) {
    const [dayOpen, setDayOpen] = useState(false);
    const shellMonth = month || `${todayKey().slice(0, 7)}-01`;
    const shellDate = selected || todayKey();

    useEffect(() => {
        if (selected) {
            setDayOpen(true);
        }
    }, [selected]);

    const calendar = (
        <CalendarMonth
            month={shellMonth}
            selected={selected}
            tones={tones}
            today={today}
            onSelect={onSelect}
            onMonthChange={onMonthChange}
            legend={legend}
        />
    );

    const dayPanel = panel ?? (
        <DayTimeline className="mt-[var(--space-xs)] min-h-[12rem] flex-1" date={shellDate} stepMinutes={20} bands={[]} blocks={[]} />
    );

    return (
        <ConfirmDialog
            title={title}
            message={message}
            messageClassName="md:hidden"
            onDismiss={onDismiss}
            className="flex h-[min(42rem,calc(100dvh-2rem))] w-[min(72rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden max-md:h-[min(42rem,calc(100dvh-var(--space-sm)*2))] max-md:max-h-[calc(100dvh-var(--space-sm)*2))]"
            headerAction={
                <Btn type="button" variant="outline" size="sm" onClick={onDismiss}>
                    <X className="size-[0.95rem] shrink-0" aria-hidden strokeWidth={2} />
                    Cerrar
                </Btn>
            }
        >
            {failed ? (
                <Empty>No se pudo cargar la agenda.</Empty>
            ) : (
                <div className="grid min-h-0 flex-1 gap-[var(--space-sm)] overflow-hidden">
                    <MobileDaySwap
                        dayOpen={dayOpen}
                        onBackToCalendar={() => setDayOpen(false)}
                        calendar={<div className="flex min-h-0 flex-1 items-center justify-center">{calendar}</div>}
                        panel={
                            <Panel title={panelTitle} className="h-full min-h-0 gap-0">
                                {dayPanel}
                            </Panel>
                        }
                    />
                    <div className="hidden min-h-0 gap-[var(--space-sm)] md:grid md:h-full md:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
                        <div className="flex min-h-0 items-center justify-center">{calendar}</div>
                        <Panel title={panelTitle} className="min-h-0 gap-0">
                            {dayPanel}
                        </Panel>
                    </div>
                </div>
            )}
        </ConfirmDialog>
    );
}
