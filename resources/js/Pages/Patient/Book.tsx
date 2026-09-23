import { Head, router } from '@inertiajs/react';
import { Calendar, List, NotebookPen } from 'lucide-react';
import { useState } from 'react';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ViewSwitch, { type ViewSwitchOption } from '@/Components/Common/ViewSwitch';
import { Btn } from '@/Components/Form/Btn';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import DoctorCard from '@/Components/Surfaces/DoctorCard';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import Results, { ResultList } from '@/Components/Surfaces/Results';
import SlotRow from '@/Components/Surfaces/SlotRow';
import StepPills from '@/Components/Common/StepPills';
import { wallTime } from '@/lib/datetime';
import { specialtyNames } from '@/lib/specialties';
import { cn } from '@/lib/utils';
import type { DoctorRecord, Slot, Specialty } from '@/types';

const scheduleViews: readonly ViewSwitchOption<'list' | 'cal'>[] = [
    { value: 'list', label: 'Lista', icon: List },
    { value: 'cal', label: 'Calendario', icon: Calendar },
];

const defaultScheduleView = 'list' satisfies 'list' | 'cal';

type Coverage = 'particular' | 'health_insurance';

type Props = {
    specialties: Specialty[];
    doctors: DoctorRecord[];
    nearest_doctor_id: number | null;
    doctor: DoctorRecord | null;
    slots: Slot[];
    daysWithSlots: string[];
    has_health_insurance: boolean;
    filters: { coverage: Coverage | null; specialty_id: number | null; doctor_id: number | null; date: string | null };
};

export default function Book({
    specialties,
    doctors,
    nearest_doctor_id,
    doctor,
    slots,
    daysWithSlots,
    has_health_insurance,
    filters,
}: Props) {
    const step = !filters.coverage ? 'coverage' : !filters.specialty_id ? 'specialty' : !filters.doctor_id ? 'doctor' : 'horario';
    const [mode, setMode] = useState<'list' | 'cal'>(defaultScheduleView);
    const [mobileDayOpen, setMobileDayOpen] = useState(Boolean(filters.date));
    const [month, setMonth] = useState((filters.date ?? daysWithSlots[0] ?? new Date().toISOString().slice(0, 10)).slice(0, 7) + '-01');
    const tones = Object.fromEntries((daysWithSlots ?? []).map((day) => [day, 'has' as const]));
    const backHref =
        step === 'specialty'
            ? '/book'
            : step === 'doctor' && filters.coverage
              ? `/book?coverage=${filters.coverage}`
              : step === 'horario' && filters.coverage && filters.specialty_id
                ? `/book?coverage=${filters.coverage}&specialty_id=${filters.specialty_id}`
                : undefined;

    const go = (query: Record<string, string | number>) => {
        router.get(
            '/book',
            {
                ...(filters.coverage ? { coverage: filters.coverage } : {}),
                ...query,
            },
            { preserveState: true },
        );
    };

    return (
        <>
            <Head title="Reservar turno" />
            <PageScreen
                header={
                    <PageHeader
                        title="Reservar turno"
                        backHref={backHref}
                        backLabel="Atrás"
                        steps={
                            <StepPills
                                steps={[
                                    { key: 'coverage', label: 'Cobertura' },
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
                    {step === 'coverage' ? (
                        <Results>
                            <ResultList>
                                <ListRow as="button" onClick={() => go({ coverage: 'particular' })}>
                                    Particular
                                </ListRow>
                                {has_health_insurance ? (
                                    <ListRow as="button" onClick={() => go({ coverage: 'health_insurance' })}>
                                        Obra social
                                    </ListRow>
                                ) : null}
                            </ResultList>
                        </Results>
                    ) : null}
                    {step === 'specialty' ? (
                        <Results>
                            {specialties.length === 0 ? (
                                <Empty>No hay especialidades con profesionales.</Empty>
                            ) : (
                                <ResultList>
                                    {specialties.map((specialty) => (
                                        <ListRow key={specialty.id} as="button" onClick={() => go({ specialty_id: specialty.id })}>
                                            {specialty.name}
                                        </ListRow>
                                    ))}
                                </ResultList>
                            )}
                        </Results>
                    ) : null}
                    {step === 'doctor' ? (
                        <Results>
                            {doctors.length === 0 ? (
                                <Empty>No hay profesionales con turnos disponibles.</Empty>
                            ) : (
                                <ResultList>
                                    {doctors.map((item) => (
                                        <DoctorCard
                                            key={item.id}
                                            className={cn(
                                                'flex-row items-center justify-between gap-[var(--space-sm)]',
                                                item.id === nearest_doctor_id && 'border-accent bg-accent/[0.06]',
                                            )}
                                            onClick={() => go({ specialty_id: filters.specialty_id ?? '', doctor_id: item.id })}
                                        >
                                            <div className="flex min-w-0 flex-1 flex-col gap-[0.65rem]">
                                                <strong>{item.user.name}</strong>
                                                <span>{specialtyNames(item.specialties)}</span>
                                            </div>
                                            {item.id === nearest_doctor_id ? (
                                                <span className="shrink-0 self-center text-right !font-medium !text-accent">
                                                    Turno más cercano
                                                </span>
                                            ) : null}
                                        </DoctorCard>
                                    ))}
                                </ResultList>
                            )}
                        </Results>
                    ) : null}
                    {step === 'horario' && doctor ? (
                        <>
                            <ViewSwitch
                                className="mb-3 self-start"
                                options={scheduleViews}
                                defaultValue={defaultScheduleView}
                                value={mode}
                                onChange={(next) => {
                                    setMode(next);
                                    if (next === 'list' && filters.date) {
                                        go({
                                            specialty_id: filters.specialty_id ?? '',
                                            doctor_id: doctor.id,
                                        });
                                    }
                                }}
                            />
                            {mode === 'cal' ? (
                                <>
                                    <MobileDaySwap
                                        dayOpen={mobileDayOpen}
                                        onBackToCalendar={() => {
                                            setMobileDayOpen(false);
                                            go({
                                                specialty_id: filters.specialty_id ?? '',
                                                doctor_id: doctor.id,
                                            });
                                        }}
                                        calendar={
                                            <CalendarMonth
                                                month={month}
                                                selected={filters.date}
                                                tones={tones}
                                                onSelect={(date) => {
                                                    setMobileDayOpen(true);
                                                    go({
                                                        specialty_id: filters.specialty_id ?? '',
                                                        doctor_id: doctor.id,
                                                        date,
                                                    });
                                                }}
                                                onMonthChange={setMonth}
                                                legend={[
                                                    { tone: 'empty', label: 'Sin turnos' },
                                                    { tone: 'has', label: 'Con turnos' },
                                                ]}
                                            />
                                        }
                                        panel={
                                            <Panel className="h-full min-h-0">
                                                <SlotList
                                                    slots={filters.date ? slots : []}
                                                    doctorId={doctor.id}
                                                    specialtyId={filters.specialty_id}
                                                />
                                            </Panel>
                                        }
                                    />
                                    <StageCard layout="split" nested className="max-md:!hidden">
                                        <CalendarMonth
                                            month={month}
                                            selected={filters.date}
                                            tones={tones}
                                            onSelect={(date) =>
                                                go({
                                                    specialty_id: filters.specialty_id ?? '',
                                                    doctor_id: doctor.id,
                                                    date,
                                                })
                                            }
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
                                </>
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
