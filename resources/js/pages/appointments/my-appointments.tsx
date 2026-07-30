import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { AppointmentsCalendar, formatDateLabel, toDateKey } from '@/components/appointments-calendar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { takeNextUpcoming, UpcomingSlotsList } from '@/components/upcoming-slots-list';
import AppLayout from '@/layouts/app-layout';
import { formatWallClockTime, wallClockDateKey } from '@/lib/datetime';

type Appointment = {
    id: number;
    starts_at: string;
    ends_at: string;
    doctor: {
        user: { name: string };
        specialty: { name: string };
    };
};

type Props = {
    appointments: Appointment[];
};

export default function MyAppointments({ appointments }: Props) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const byDate = useMemo(() => {
        const map = new Map<string, Appointment[]>();

        for (const appointment of appointments) {
            const key = toDateKey(appointment.starts_at);
            const list = map.get(key) ?? [];
            list.push(appointment);
            map.set(key, list);
        }

        for (const list of map.values()) {
            list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        }

        return map;
    }, [appointments]);

    const markedDates = useMemo(() => new Set(byDate.keys()), [byDate]);
    const dayAppointments = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
    const upcoming = useMemo(() => takeNextUpcoming(appointments, 5), [appointments]);

    const cancel = (id: number) => {
        if (confirm('¿Cancelar este turno?')) {
            router.post(route('appointments.cancel', id), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Mis turnos', href: '/my-appointments' }]}>
            <Head title="Mis turnos" />
            <div className="page-shell page-shell--wide">
                <PageHeader title="Mis turnos" description="Elegí un día para ver el detalle de tus reservas." />

                <div className="agenda-layout">
                    <AppointmentsCalendar
                        markedDates={markedDates}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <div className="grid min-w-0 gap-4">
                        <UpcomingSlotsList
                            items={upcoming.map((appointment) => ({
                                id: appointment.id,
                                starts_at: appointment.starts_at,
                                subtitle: `${appointment.doctor.user.name} · ${appointment.doctor.specialty.name}`,
                            }))}
                            emptyMessage="No tenés turnos próximos."
                            onSelect={(startsAt) => setSelectedDate(wallClockDateKey(startsAt))}
                        />

                        <section className="surface min-w-0">
                            {!selectedDate ? (
                                <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                    Seleccioná un día del calendario para ver tus turnos.
                                </p>
                            ) : (
                                <div className="grid gap-5">
                                    <header className="border-b border-[var(--color-rule)] pb-4">
                                        <h2 className="font-display text-[length:var(--text-xl)] capitalize">
                                            {formatDateLabel(selectedDate)}
                                        </h2>
                                        <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                            {dayAppointments.length === 0
                                                ? 'No tenés turnos este día.'
                                                : `${dayAppointments.length} turno(s) este día.`}
                                        </p>
                                    </header>

                                    <div className="grid gap-3">
                                        {dayAppointments.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="rounded-[var(--radius-card)] border border-[var(--color-rule)] p-4"
                                            >
                                                <p className="font-display text-[length:var(--text-md)]">
                                                    {appointment.doctor.user.name}
                                                </p>
                                                <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                                    {appointment.doctor.specialty.name} ·{' '}
                                                    {formatWallClockTime(appointment.starts_at)} —{' '}
                                                    {formatWallClockTime(appointment.ends_at)}
                                                </p>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => cancel(appointment.id)}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
