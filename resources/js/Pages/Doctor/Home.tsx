import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, CalendarPlus, Users } from 'lucide-react';
import PageScreen from '@/Components/Common/PageScreen';
import PatientProfileBtn from '@/Components/Common/PatientProfileBtn';
import { Btn } from '@/Components/Form/Btn';
import HomeHero, { HomeStartPrimary, HomeStartSecondary, HomeUpcoming, HomeUpcomingItem, HomeUpcomingList } from '@/Components/Home/HomeHero';
import { BookingCardFields } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import type { AppointmentRecord, SharedData } from '@/types';

type Props = {
    upcoming: AppointmentRecord[];
};

export default function DoctorHome({ upcoming }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Inicio" />
            <PageScreen layout="home">
                <HomeHero title={`Hola, ${auth.user?.name}`} subtitle="Gestioná tu agenda y tus pacientes.">
                    <HomeStartPrimary>
                        <Btn prominence="cta" asChild>
                            <Link href="/agenda">
                                <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Ver agenda
                            </Link>
                        </Btn>
                    </HomeStartPrimary>
                    <HomeStartSecondary>
                        <Btn variant="outline" block asChild>
                            <Link href="/agenda/program">
                                <CalendarPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Programar turnos
                            </Link>
                        </Btn>
                        <Btn variant="outline" block asChild>
                            <Link href="/my-patients">
                                <Users className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Mis pacientes
                            </Link>
                        </Btn>
                    </HomeStartSecondary>
                    <HomeUpcoming
                        actions={
                            <Btn variant="outline" size="sm" asChild>
                                <Link href="/agenda">
                                    <CalendarClock className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                    Ver agenda
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
                                        actions={
                                            <PatientProfileBtn
                                                patientId={appointment.patient_id}
                                                name={appointment.patient?.user.name}
                                                label="Ver paciente"
                                            />
                                        }
                                    >
                                        <BookingCardFields appointment={appointment} />
                                    </HomeUpcomingItem>
                                ))}
                            </HomeUpcomingList>
                        )}
                    </HomeUpcoming>
                </HomeHero>
            </PageScreen>
        </>
    );
}
