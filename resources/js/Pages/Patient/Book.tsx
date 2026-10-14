import { Head, router } from '@inertiajs/react';
import { Calendar, List, NotebookPen, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import MobileDaySwap from '@/Components/Common/MobileDaySwap';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ViewSwitch, { type ViewSwitchOption } from '@/Components/Common/ViewSwitch';
import { Btn } from '@/Components/Form/Btn';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import CatalogCard from '@/Components/Surfaces/CatalogCard';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import Results, { ResultList } from '@/Components/Surfaces/Results';
import SlotRow from '@/Components/Surfaces/SlotRow';
import StepPills from '@/Components/Common/StepPills';
import { wallTime } from '@/lib/datetime';
import { specialtyNames } from '@/lib/specialties';
import { cn } from '@/lib/utils';
import type { ProfessionalRecord, Slot, Specialty } from '@/types';

const scheduleViews: readonly ViewSwitchOption<'list' | 'cal'>[] = [
    { value: 'list', label: 'Lista', icon: List },
    { value: 'cal', label: 'Calendario', icon: Calendar },
];

const defaultScheduleView = 'list' satisfies 'list' | 'cal';

type Coverage = 'particular' | 'health_insurance';

type Props = {
    specialties: Specialty[];
    professionals: ProfessionalRecord[];
    nearest_professional_id: number | null;
    professional: ProfessionalRecord | null;
    slots: Slot[];
    daysWithSlots: string[];
    has_health_insurance: boolean;
    filters: { coverage: Coverage | null; specialty_id: number | null; professional_id: number | null; date: string | null };
};

export default function Book({
    specialties,
    professionals,
    nearest_professional_id,
    professional,
    slots,
    daysWithSlots,
    has_health_insurance,
    filters,
}: Props) {
    const step = !filters.coverage ? 'coverage' : !filters.specialty_id ? 'specialty' : !filters.professional_id ? 'professional' : 'horario';
    const [specialtyQuery, setSpecialtyQuery] = useState('');
    const [professionalQuery, setProfessionalQuery] = useState('');
    const [mode, setMode] = useState<'list' | 'cal'>(defaultScheduleView);
    const [mobileDayOpen, setMobileDayOpen] = useState(Boolean(filters.date));
    const [month, setMonth] = useState((filters.date ?? daysWithSlots[0] ?? new Date().toISOString().slice(0, 10)).slice(0, 7) + '-01');
    const tones = Object.fromEntries((daysWithSlots ?? []).map((day) => [day, 'has' as const]));
    const backHref =
        step === 'specialty'
            ? '/paciente/reserva'
            : step === 'professional' && filters.coverage
              ? `/paciente/reserva?coverage=${filters.coverage}`
              : step === 'horario' && filters.coverage && filters.specialty_id
                ? `/paciente/reserva?coverage=${filters.coverage}&specialty_id=${filters.specialty_id}`
                : undefined;

    const go = (query: Record<string, string | number>) => {
        router.get(
            '/paciente/reserva',
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
                                    { key: 'professional', label: 'Profesional' },
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
                            <StepTitle>Elegí qué cobertura:</StepTitle>
                            <div className="flex min-h-0 flex-1 items-center justify-center">
                                <div className="grid w-full max-w-[24rem] grid-cols-2 gap-[var(--space-sm)]">
                                    <CoverageCard label="Particular" onClick={() => go({ coverage: 'particular' })} />
                                    <CoverageCard
                                        label="Prepaga"
                                        disabled={!has_health_insurance}
                                        onClick={() => go({ coverage: 'health_insurance' })}
                                    />
                                </div>
                            </div>
                        </Results>
                    ) : null}
                    {step === 'specialty' ? (
                        <Results>
                            <StepTitle>Elegí tu especialidad:</StepTitle>
                            {specialties.length === 0 ? (
                                <Empty>No hay especialidades con profesionales.</Empty>
                            ) : (
                                <>
                                    <NameSearch id="specialty-search" value={specialtyQuery} onChange={setSpecialtyQuery} />
                                    <FilteredList
                                        items={specialties.filter((specialty) => matchesQuery(specialty.name, specialtyQuery))}
                                        empty="Ninguna especialidad coincide."
                                        render={(specialty) => (
                                            <ListRow key={specialty.id} as="button" onClick={() => go({ specialty_id: specialty.id })}>
                                                {specialty.name}
                                            </ListRow>
                                        )}
                                    />
                                </>
                            )}
                        </Results>
                    ) : null}
                    {step === 'professional' ? (
                        <Results>
                            <StepTitle>Elegí el profesional:</StepTitle>
                            {professionals.length === 0 ? (
                                <Empty>No hay profesionales con turnos disponibles.</Empty>
                            ) : (
                                <>
                                    <NameSearch id="professional-search" value={professionalQuery} onChange={setProfessionalQuery} />
                                    <FilteredList
                                        items={professionals.filter((item) =>
                                            matchesQuery(`${item.user.name} ${specialtyNames(item.specialties)}`, professionalQuery),
                                        )}
                                        empty="Ningún profesional coincide."
                                        render={(item) => (
                                            <CatalogCard
                                                key={item.id}
                                                className={cn(
                                                    'flex-row items-center justify-between gap-[var(--space-sm)]',
                                                    item.id === nearest_professional_id && 'border-accent bg-accent/[0.06]',
                                                )}
                                                onClick={() => go({ specialty_id: filters.specialty_id ?? '', professional_id: item.id })}
                                            >
                                                <div className="flex min-w-0 flex-1 flex-col gap-[0.65rem]">
                                                    <strong>{item.user.name}</strong>
                                                    <span>{specialtyNames(item.specialties)}</span>
                                                </div>
                                                {item.id === nearest_professional_id ? (
                                                    <span className="shrink-0 self-center text-right !font-medium !text-accent">
                                                        Turno más cercano
                                                    </span>
                                                ) : null}
                                            </CatalogCard>
                                        )}
                                    />
                                </>
                            )}
                        </Results>
                    ) : null}
                    {step === 'horario' && professional ? (
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
                                            professional_id: professional.id,
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
                                                professional_id: professional.id,
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
                                                        professional_id: professional.id,
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
                                                    professionalId={professional.id}
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
                                                    professional_id: professional.id,
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
                                                professionalId={professional.id}
                                                specialtyId={filters.specialty_id}
                                            />
                                        </Panel>
                                    </StageCard>
                                </>
                            ) : (
                                <SlotList slots={slots.slice(0, 40)} professionalId={professional.id} specialtyId={filters.specialty_id} />
                            )}
                        </>
                    ) : null}
                </StageCard>
            </PageScreen>
        </>
    );
}

function CoverageCard({ label, disabled = false, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
    return (
        <CatalogCard
            disabled={disabled}
            className="aspect-square items-center justify-center text-center disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-rule"
            onClick={onClick}
        >
            <strong>{label}</strong>
        </CatalogCard>
    );
}

function NameSearch({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
    return (
        <Field label="Buscar" htmlFor={id} flush className="mb-3 shrink-0">
            <div className="relative">
                <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-[1.05rem] -translate-y-1/2 text-ink-2"
                    aria-hidden
                    strokeWidth={2}
                />
                <TextInput id={id} value={value} placeholder="Buscar" className="pl-9" onChange={(event) => onChange(event.target.value)} />
            </div>
        </Field>
    );
}

function FilteredList<T>({ items, empty, render }: { items: T[]; empty: string; render: (item: T) => ReactNode }) {
    if (items.length === 0) {
        return <Empty>{empty}</Empty>;
    }

    return <ResultList>{items.map(render)}</ResultList>;
}

function matchesQuery(value: string, query: string): boolean {
    const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

    return normalize(value).includes(normalize(query.trim()));
}

function StepTitle({ children }: { children: string }) {
    return <h2 className="m-0 mb-3 shrink-0 font-display text-[length:var(--text-md)] font-semibold leading-[1.3] text-ink">{children}</h2>;
}

function SlotList({ slots, professionalId, specialtyId }: { slots: Slot[]; professionalId: number; specialtyId: number | null }) {
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
                            router.post(`/professionals/${professionalId}/appointments`, {
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
