import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppointmentDetailDialog from '@/Components/Appointments/AppointmentDetailDialog';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import BookingCard, { BookingCardFields, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import type { AppointmentRecord } from '@/types';

type Props = {
    appointments: AppointmentRecord[];
    backHref?: string;
    backLabel?: string;
};

export default function AppointmentHistory({
    appointments,
    backHref = '/paciente/mis-turnos',
    backLabel = 'Mis turnos',
}: Props) {
    const [openId, setOpenId] = useState<number | null>(null);
    const open = appointments.find((appointment) => appointment.id === openId) ?? null;

    return (
        <>
            <Head title="Historial de turnos" />
            <PageScreen
                header={
                    <PageHeader
                        title="Historial de turnos"
                        description="Tus reservas pasadas."
                        backHref={backHref}
                        backLabel={backLabel}
                    />
                }
            >
                <StageCard>
                    {appointments.length === 0 ? (
                        <Empty>No tenés turnos anteriores.</Empty>
                    ) : (
                        <BookingList>
                            {appointments.map((appointment) => (
                                <BookingCard
                                    key={appointment.id}
                                    as="button"
                                    onClick={() => setOpenId(appointment.id)}
                                    aria-label="Ver detalle del turno"
                                >
                                    <BookingCardFields appointment={appointment} />
                                </BookingCard>
                            ))}
                        </BookingList>
                    )}
                </StageCard>
            </PageScreen>
            {open ? <AppointmentDetailDialog appointment={open} onDismiss={() => setOpenId(null)} /> : null}
        </>
    );
}
