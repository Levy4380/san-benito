import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import BookingCard, { BookingCardFields, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
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
                                    <BookingCardFields appointment={appointment} />
                                </BookingCard>
                            ))}
                        </BookingList>
                    )}
                </StageCard>
            </PageScreen>
        </>
    );
}
