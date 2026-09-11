import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, NotebookPen, Search } from 'lucide-react';
import PageScreen from '@/Components/Common/PageScreen';
import { Btn } from '@/Components/Form/Btn';
import Empty from '@/Components/Surfaces/Empty';
import HomeHero, { HomeStartPrimary, HomeUpcoming, HomeUpcomingItem, HomeUpcomingList } from '@/Components/Home/HomeHero';
import { firstName, wallDate, wallTime } from '@/lib/datetime';
import type { AppointmentRecord, SharedData } from '@/types';

type Props = {
    upcoming: AppointmentRecord[];
};

export default function PatientHome({ upcoming }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Inicio" />
            <PageScreen layout="home">
                <HomeHero title={`Hola, ${firstName(auth.user?.name ?? '')}`} subtitle="¿Cómo podemos ayudarte hoy?">
                    <HomeStartPrimary>
                        <Btn prominence="cta" asChild>
                            <Link href="/book">
                                <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Reservar turno
                            </Link>
                        </Btn>
                        <Btn variant="outline" prominence="cta" asChild>
                            <Link href="/doctors">
                                <Search className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Buscar profesionales
                            </Link>
                        </Btn>
                    </HomeStartPrimary>
                    <HomeUpcoming
                        actions={
                            <Btn variant="outline" size="sm" asChild>
                                <Link href="/my-appointments">
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
                                        title={`${wallDate(appointment.starts_at)} · ${wallTime(appointment.starts_at)}`}
                                        meta={appointment.doctor?.user.name}
                                    />
                                ))}
                            </HomeUpcomingList>
                        )}
                    </HomeUpcoming>
                </HomeHero>
            </PageScreen>
        </>
    );
}
