import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, NotebookPen, Search } from 'lucide-react';
import { useState } from 'react';
import AppointmentDetailDialog from '@/Components/Appointments/AppointmentDetailDialog';
import PageScreen from '@/Components/Common/PageScreen';
import { Btn } from '@/Components/Form/Btn';
import HomeHero, { HomeStartPrimary, HomeUpcoming, HomeUpcomingItem, HomeUpcomingList } from '@/Components/Home/HomeHero';
import { BookingCardFields } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import { firstName } from '@/lib/datetime';
import type { AppointmentRecord, SharedData } from '@/types';

type Props = {
    upcoming: AppointmentRecord[];
};

export default function PatientHome({ upcoming }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [openId, setOpenId] = useState<number | null>(null);
    const open = upcoming.find((appointment) => appointment.id === openId) ?? null;

    return (
        <>
            <Head title="Inicio" />
            <PageScreen layout="home">
                <HomeHero title={`Hola, ${firstName(auth.user?.name ?? '')}`} subtitle="¿Cómo podemos ayudarte hoy?">
                    <HomeStartPrimary>
                        <Btn prominence="cta" asChild>
                            <Link href="/paciente/reserva">
                                <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Reservar turno
                            </Link>
                        </Btn>
                        <Btn variant="outline" prominence="cta" asChild>
                            <Link href="/paciente/profesionales">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar profesionales
                            </Link>
                        </Btn>
                    </HomeStartPrimary>
                    <HomeUpcoming
                        actions={
                            <Btn variant="outline" size="sm" asChild>
                                <Link href="/paciente/mis-turnos">
                                    <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Ver turnos
                                </Link>
                            </Btn>
                        }
                    >
                        {upcoming.length === 0 ? (
                            <Empty>Esta semana no tenés ningún turno.</Empty>
                        ) : (
                            <HomeUpcomingList>
                                {upcoming.map((appointment) => (
                                    <HomeUpcomingItem
                                        key={appointment.id}
                                        onClick={() => setOpenId(appointment.id)}
                                        aria-label="Ver detalle del turno"
                                    >
                                        <BookingCardFields appointment={appointment} />
                                    </HomeUpcomingItem>
                                ))}
                            </HomeUpcomingList>
                        )}
                    </HomeUpcoming>
                </HomeHero>
            </PageScreen>
            {open ? <AppointmentDetailDialog appointment={open} onDismiss={() => setOpenId(null)} /> : null}
        </>
    );
}
