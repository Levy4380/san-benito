import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import BookingCard, { BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import { wallDate, wallTime } from '@/lib/datetime';
import type { AppointmentRecord } from '@/types';

type Props = {
    appointments: AppointmentRecord[];
};

export default function AppointmentHistory({ appointments }: Props) {
    return (
        <>
            <Head title="Historial de turnos" />
            <PageScreen
                header={
                    <PageHeader
                        title="Historial de turnos"
                        description="Tus reservas pasadas."
                        backHref="/my-appointments"
                        backLabel="Mis turnos"
                    />
                }
            >
                <StageCard>
                    {appointments.length === 0 ? (
                        <Empty>No tenés turnos anteriores.</Empty>
                    ) : (
                        <BookingList>
                            {appointments.map((appointment) => (
                                <BookingCard key={appointment.id}>
                                    <strong>
                                        {wallDate(appointment.starts_at)} · {wallTime(appointment.starts_at)}
                                    </strong>
                                    <BookingCardRow>
                                        <span className="min-w-0 truncate text-sm">
                                            {appointment.doctor?.user.name}
                                            {appointment.doctor?.specialty.name ? ` · ${appointment.doctor.specialty.name}` : ''}
                                        </span>
                                    </BookingCardRow>
                                </BookingCard>
                            ))}
                        </BookingList>
                    )}
                </StageCard>
            </PageScreen>
        </>
    );
}
