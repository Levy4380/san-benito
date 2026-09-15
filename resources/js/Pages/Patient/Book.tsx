import { Head, router } from '@inertiajs/react';
import { NotebookPen } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ViewSwitch from '@/Components/Common/ViewSwitch';
import { Btn } from '@/Components/Form/Btn';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import DoctorCard from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import Results from '@/Components/Surfaces/Results';
import SlotRow from '@/Components/Surfaces/SlotRow';
import StepPills from '@/Components/Common/StepPills';
import { wallTime } from '@/lib/datetime';
import { specialtyNames } from '@/lib/specialties';
import type { DoctorRecord, Slot, Specialty } from '@/types';

type Props = {
    specialties: Specialty[];
    doctors: DoctorRecord[];
    doctor: DoctorRecord | null;
    slots: Slot[];
    daysWithSlots: string[];
    filters: { specialty_id: number | null; doctor_id: number | null; date: string | null };
};

export default function Book({ specialties, doctors, doctor, slots, daysWithSlots, filters }: Props) {
    const step = !filters.specialty_id ? 'specialty' : !filters.doctor_id ? 'doctor' : 'horario';
    const [mode, setMode] = useState<'list' | 'cal'>('list');
    const [month, setMonth] = useState((filters.date ?? daysWithSlots[0] ?? new Date().toISOString().slice(0, 10)).slice(0, 7) + '-01');
    const tones = Object.fromEntries((daysWithSlots ?? []).map((day) => [day, 'has' as const]));

    const go = (query: Record<string, string | number>) => {
        router.get('/book', query, { preserveState: true });
    };

    return (
        <>
            <Head title="Reservar turno" />
            <PageScreen
                header={
                    <PageHeader
                        title="Reservar turno"
                        steps={
                            <StepPills
                                steps={[
                                    { key: 'specialty', label: 'Especialidad' },
                                    { key: 'doctor', label: 'Doctor' },
                                    { key: 'horario', label: 'Horario' },
                                ]}
                                current={step}
                            />
                        }
                    />
                }
            >
                <StageCard id="book-body">
                    {step === 'specialty' ? (
                        <Results>
                            {specialties.map((specialty) => (
                                <ListRow key={specialty.id} as="button" onClick={() => go({ specialty_id: specialty.id })}>
                                    {specialty.name}
                                </ListRow>
                            ))}
                        </Results>
                    ) : null}
                    {step === 'doctor' ? (
                        <Results>
                            {doctors.map((item) => (
                                <DoctorCard
                                    key={item.id}
                                    onClick={() => go({ specialty_id: filters.specialty_id ?? '', doctor_id: item.id })}
                                >
                                    <strong>{item.user.name}</strong>
                                    <span>{specialtyNames(item.specialties)}</span>
                                </DoctorCard>
                            ))}
                        </Results>
                    ) : null}
                    {step === 'horario' && doctor ? (
                        <>
                            <ViewSwitch className="mb-3 self-start" value={mode} onChange={setMode} />
                            {mode === 'cal' ? (
                                <StageCard layout="split" nested>
                                    <CalendarMonth
                                        month={month}
                                        selected={filters.date}
                                        tones={tones}
                                        onSelect={(date) => go({ specialty_id: filters.specialty_id ?? '', doctor_id: doctor.id, date })}
                                        onMonthChange={setMonth}
                                        legend={[
                                            { tone: 'empty', label: 'Sin turnos' },
                                            { tone: 'has', label: 'Con turnos' },
                                        ]}
                                    />
                                    <Panel sheet>
                                        <SlotList
                                            slots={filters.date ? slots : []}
                                            doctorId={doctor.id}
                                            specialtyId={filters.specialty_id}
                                        />
                                    </Panel>
                                </StageCard>
                            ) : (
                                <SlotList slots={slots.slice(0, 40)} doctorId={doctor.id} specialtyId={filters.specialty_id} />
                            )}
                        </>
                    ) : null}
                </StageCard>
            </PageScreen>
        </>
    );
}

function SlotList({ slots, doctorId, specialtyId }: { slots: Slot[]; doctorId: number; specialtyId: number | null }) {
    if (slots.length === 0) {
        return <Empty>No hay horarios para mostrar.</Empty>;
    }

    return (
        <PanelScroll className="pt-0">
            {slots.map((slot) => (
                <SlotRow key={slot.starts_at}>
                    <strong>
                        {slot.starts_at.slice(0, 10)} · {wallTime(slot.starts_at)} — {wallTime(slot.ends_at)}
                    </strong>
                    <Btn
                        type="button"
                        size="sm"
                        className="shrink-0"
                        disabled={!specialtyId}
                        onClick={() =>
                            router.post(`/doctors/${doctorId}/appointments`, {
                                starts_at: slot.starts_at,
                                specialty_id: specialtyId,
                            })
                        }
                    >
                        <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Reservar
                    </Btn>
                </SlotRow>
            ))}
        </PanelScroll>
    );
}
