import { Head, Link, router } from '@inertiajs/react';
import { Calendar, History, List, NotebookPen, X } from 'lucide-react';
import { useState } from 'react';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ViewSwitch, { type ViewSwitchOption } from '@/Components/Common/ViewSwitch';
import { Btn } from '@/Components/Form/Btn';
import BookingCard, { BookingCardActions, BookingCardFields, BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import Empty from '@/Components/Surfaces/Empty';
import Panel from '@/Components/Surfaces/Panel';
import { wallDate } from '@/lib/datetime';
import type { AppointmentRecord } from '@/types';

type Props = {
    appointments: AppointmentRecord[];
    today: string;
};

const appointmentViews: readonly ViewSwitchOption<'list' | 'cal'>[] = [
    { value: 'list', label: 'Lista', icon: List },
    { value: 'cal', label: 'Calendario', icon: Calendar },
];

const defaultAppointmentView = 'list' satisfies 'list' | 'cal';

export default function MyAppointments({ appointments, today }: Props) {
    const [mode, setMode] = useState<'list' | 'cal'>(defaultAppointmentView);
    const { ask, dialog } = useConfirm();
    const days = appointments.map((appointment) => wallDate(appointment.starts_at));
    const tones = Object.fromEntries(days.map((day) => [day, 'has' as const]));
    const [month, setMonth] = useState((days[0] ?? today).slice(0, 7) + '-01');
    const [selected, setSelected] = useState<string | null>(days[0] ?? null);
    const [mobileDayOpen, setMobileDayOpen] = useState(false);
    const visible = mode === 'cal' && selected ? appointments.filter((appointment) => wallDate(appointment.starts_at) === selected) : appointments;

    const cancel = async (id: number) => {
        const ok = await ask({
            title: 'Cancelar turno',
            message: '¿Cancelar este turno? El horario volverá a estar disponible.',
            confirmLabel: 'Cancelar turno',
            danger: true,
        });
        if (ok) {
            router.delete(`/appointments/${id}`);
        }
    };

    const selectDay = (date: string) => {
        setSelected(date);
        setMobileDayOpen(true);
    };

    const calendar = (
        <CalendarMonth
            month={month}
            selected={selected}
            tones={tones}
            minDate={today}
            onSelect={selectDay}
            onMonthChange={setMonth}
            legend={[
                { tone: 'empty', label: 'Sin turnos' },
                { tone: 'has', label: 'Con turnos' },
            ]}
        />
    );

    const dayList = <AppointmentList appointments={visible} onCancel={cancel} />;

    return (
        <>
            <Head title="Mis turnos" />
            <PageScreen
                header={
                    <PageHeader
                        title="Mis turnos"
                        description="Tus reservas futuras."
                        actions={
                            <>
                                <ViewSwitch
                                    options={appointmentViews}
                                    defaultValue={defaultAppointmentView}
                                    value={mode}
                                    onChange={(next) => {
                                        setMode(next);
                                        if (next === 'cal') {
                                            setMobileDayOpen(false);
                                        }
                                    }}
                                />
                                <Btn variant="outline" asChild>
                                    <Link href="/my-appointments/history">
                                        <History className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Historial de turnos
                                    </Link>
                                </Btn>
                                <Btn asChild>
                                    <Link href="/book">
                                        <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Reservar turno
                                    </Link>
                                </Btn>
                            </>
                        }
                    />
                }
            >
                <StageCard id="my-body">
                    {mode === 'cal' ? (
                        <>
                            <MobileDaySwap
                                dayOpen={mobileDayOpen}
                                onBackToCalendar={() => setMobileDayOpen(false)}
                                calendar={calendar}
                                panel={<Panel className="h-full min-h-0">{dayList}</Panel>}
                            />
                            <StageCard layout="split" className="max-md:!hidden">
                                <CalendarMonth
                                    month={month}
                                    selected={selected}
                                    tones={tones}
                                    minDate={today}
                                    onSelect={setSelected}
                                    onMonthChange={setMonth}
                                    legend={[
                                        { tone: 'empty', label: 'Sin turnos' },
                                        { tone: 'has', label: 'Con turnos' },
                                    ]}
                                />
                                <Panel sheet>{dayList}</Panel>
                            </StageCard>
                        </>
                    ) : (
                        <AppointmentList appointments={visible} onCancel={cancel} />
                    )}
                </StageCard>
            </PageScreen>
            {dialog}
        </>
    );
}

function AppointmentList({ appointments, onCancel }: { appointments: AppointmentRecord[]; onCancel: (id: number) => void }) {
    if (appointments.length === 0) {
        return <Empty>No tenés turnos próximos.</Empty>;
    }

    return (
        <BookingList>
            {appointments.map((appointment) => (
                <BookingCard key={appointment.id}>
                    <BookingCardRow>
                        <BookingCardFields appointment={appointment} />
                        <BookingCardActions>
                            <Btn type="button" variant="danger" size="xs" onClick={() => onCancel(appointment.id)}>
                                <X className="size-3 shrink-0" aria-hidden strokeWidth={2} />
                                Cancelar
                            </Btn>
                        </BookingCardActions>
                    </BookingCardRow>
                </BookingCard>
            ))}
        </BookingList>
    );
}
