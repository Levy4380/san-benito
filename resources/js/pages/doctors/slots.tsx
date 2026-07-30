import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { AppointmentsCalendar, formatDateLabel, toDateKey } from '@/components/appointments-calendar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { takeNextUpcoming, UpcomingSlotsList } from '@/components/upcoming-slots-list';
import AppLayout from '@/layouts/app-layout';
import { formatWallClockTime, wallClockDateKey } from '@/lib/datetime';
import { type SharedData } from '@/types';

type Slot = {
    id: number;
    starts_at: string;
    ends_at: string;
};

type Doctor = {
    id: number;
    user: { name: string };
    specialty: { name: string };
};

type Props = {
    doctor: Doctor;
    slots: Slot[];
};

export default function DoctorSlots({ doctor, slots }: Props) {
    const { errors } = usePage<SharedData>().props;
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const byDate = useMemo(() => {
        const map = new Map<string, Slot[]>();

        for (const slot of slots) {
            const key = toDateKey(slot.starts_at);
            const list = map.get(key) ?? [];
            list.push(slot);
            map.set(key, list);
        }

        for (const list of map.values()) {
            list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        }

        return map;
    }, [slots]);

    const markedDates = useMemo(() => new Set(byDate.keys()), [byDate]);
    const daySlots = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
    const upcoming = useMemo(() => takeNextUpcoming(slots, 5), [slots]);

    const book = (appointmentId: number) => {
        router.post(route('appointments.book', appointmentId), {}, { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Doctores', href: '/doctors' },
                { title: doctor.user.name, href: `/doctors/${doctor.id}/slots` },
            ]}
        >
            <Head title={`Turnos de ${doctor.user.name}`} />
            <div className="page-shell page-shell--wide">
                <PageHeader
                    title="Turnos disponibles"
                    description={`${doctor.user.name} · ${doctor.specialty.name}. Elegí un día marcado.`}
                />

                {errors.appointment && (
                    <p className="text-[length:var(--text-sm)] text-[var(--color-danger)]">
                        {errors.appointment as string}
                    </p>
                )}

                <div className="agenda-layout">
                    <AppointmentsCalendar
                        markedDates={markedDates}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <div className="grid min-w-0 gap-4">
                        <UpcomingSlotsList
                            items={upcoming.map((slot) => ({
                                id: slot.id,
                                starts_at: slot.starts_at,
                                ends_at: slot.ends_at,
                                subtitle: 'Disponible',
                            }))}
                            emptyMessage="No hay turnos próximos disponibles."
                            onSelect={(startsAt) => setSelectedDate(wallClockDateKey(startsAt))}
                        />

                        <section className="surface min-w-0">
                            {!selectedDate ? (
                                <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                    Seleccioná un día del calendario para ver horarios y reservar.
                                </p>
                            ) : (
                                <div className="grid gap-5">
                                    <header className="border-b border-[var(--color-rule)] pb-4">
                                        <h2 className="font-display text-[length:var(--text-xl)] capitalize">
                                            {formatDateLabel(selectedDate)}
                                        </h2>
                                        <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                            {daySlots.length === 0
                                                ? 'No hay turnos disponibles este día.'
                                                : `${daySlots.length} horario(s) disponible(s).`}
                                        </p>
                                    </header>

                                    <div className="grid gap-3">
                                        {daySlots.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-rule)] p-4"
                                            >
                                                <p className="font-display text-[length:var(--text-md)]">
                                                    {formatWallClockTime(slot.starts_at)} —{' '}
                                                    {formatWallClockTime(slot.ends_at)}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    className="whitespace-nowrap"
                                                    onClick={() => book(slot.id)}
                                                >
                                                    Reservar
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
