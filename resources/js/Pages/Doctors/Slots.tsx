import { Head, router } from '@inertiajs/react';
import { NotebookPen } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import CalendarMonth from '@/Components/Calendar/CalendarMonth';
import Empty from '@/Components/Surfaces/Empty';
import ListRow from '@/Components/Surfaces/ListRow';
import Panel, { PanelScroll } from '@/Components/Surfaces/Panel';
import SlotRow from '@/Components/Surfaces/SlotRow';
import { wallTime } from '@/lib/datetime';
import type { DoctorRecord, Slot } from '@/types';

type Props = {
    doctor: DoctorRecord;
    selectedDate: string | null;
    daysWithSlots: string[];
    slots: Slot[];
    previewDays: string[];
    specialtyId: number | null;
};

export default function DoctorSlots({ doctor, selectedDate, daysWithSlots, slots, previewDays, specialtyId }: Props) {
    const [month, setMonth] = useState((selectedDate ?? previewDays[0] ?? new Date().toISOString().slice(0, 10)).slice(0, 7) + '-01');
    const tones = Object.fromEntries(daysWithSlots.map((day) => [day, 'has' as const]));
    const onlySpecialty = doctor.specialties.length === 1 ? doctor.specialties[0] : null;
    const selectedSpecialtyId = specialtyId ?? onlySpecialty?.id ?? null;
    const selectedSpecialty = doctor.specialties.find((specialty) => specialty.id === selectedSpecialtyId) ?? null;
    const description = selectedSpecialty
        ? `${doctor.user.name} · ${selectedSpecialty.name}. Elegí un día marcado.`
        : `${doctor.user.name}. Elegí una especialidad y un día marcado.`;

    const go = (query: { date?: string; specialty_id?: number }) => {
        router.get(`/doctors/${doctor.id}/slots`, query, { preserveState: true });
    };

    const selectDay = (date: string) => {
        go({ date, specialty_id: selectedSpecialtyId ?? undefined });
    };

    const chooseSpecialty = (value: string) => {
        go({
            date: selectedDate ?? undefined,
            specialty_id: value ? Number(value) : undefined,
        });
    };

    const book = (startsAt: string) => {
        if (!selectedSpecialtyId) {
            return;
        }
        router.post(`/doctors/${doctor.id}/appointments`, {
            starts_at: startsAt,
            specialty_id: selectedSpecialtyId,
        });
    };

    return (
        <>
            <Head title="Turnos disponibles" />
            <PageScreen
                layout="split"
                header={
                    <PageHeader
                        title="Turnos disponibles"
                        description={description}
                        backHref={`/doctors/${doctor.id}`}
                        backLabel={doctor.user.name}
                    />
                }
            >
                <StageCard layout="split">
                    <CalendarMonth
                        month={month}
                        selected={selectedDate}
                        tones={tones}
                        onSelect={selectDay}
                        onMonthChange={setMonth}
                        legend={[
                            { tone: 'empty', label: 'Sin turnos' },
                            { tone: 'has', label: 'Con turnos' },
                        ]}
                    />
                    <Panel sheet title={!selectedDate ? 'Próximos días con turnos' : selectedDate}>
                        <Field label="Especialidad" htmlFor="slot_specialty_id" className="shrink-0">
                            <NativeSelect
                                id="slot_specialty_id"
                                value={selectedSpecialtyId ?? ''}
                                onChange={(event) => chooseSpecialty(event.target.value)}
                            >
                                <option value="">Elegí una especialidad</option>
                                {doctor.specialties.map((specialty) => (
                                    <option key={specialty.id} value={specialty.id}>
                                        {specialty.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        <PanelScroll className="pt-0">
                            {!selectedDate ? (
                                previewDays.length === 0 ? (
                                    <Empty>No hay turnos disponibles.</Empty>
                                ) : (
                                    previewDays.map((day) => (
                                        <ListRow key={day} as="button" onClick={() => selectDay(day)}>
                                            {day}
                                        </ListRow>
                                    ))
                                )
                            ) : slots.length === 0 ? (
                                <Empty>No hay horarios en este día.</Empty>
                            ) : (
                                slots.map((slot) => (
                                    <SlotRow key={slot.starts_at}>
                                        <strong>
                                            {wallTime(slot.starts_at)} — {wallTime(slot.ends_at)}
                                        </strong>
                                        <Btn
                                            type="button"
                                            size="sm"
                                            className="shrink-0"
                                            disabled={!selectedSpecialtyId}
                                            onClick={() => book(slot.starts_at)}
                                        >
                                            <NotebookPen className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                            Reservar
                                        </Btn>
                                    </SlotRow>
                                ))
                            )}
                        </PanelScroll>
                    </Panel>
                </StageCard>
            </PageScreen>
        </>
    );
}
