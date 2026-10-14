import DayTimeline from '@/Components/Calendar/DayTimeline';
import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import FieldError from '@/Components/Form/FieldError';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import { PanelScroll } from '@/Components/Surfaces/Panel';
import SlotRow from '@/Components/Surfaces/SlotRow';
import { formatDateLabel, wallTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { AppointmentRecord, AvailabilityWindowRecord, Slot } from '@/types';
import { router } from '@inertiajs/react';
import { Undo2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

type AssignOptions = {
    date: string;
    today: string;
    days: string[];
    slots: Slot[];
    slotMinutes: number;
    timeline: { windows: AvailabilityWindowRecord[]; appointments: AppointmentRecord[]; now: string };
    patients: { id: number; name: string; dni: string }[];
    specialties: { id: number; name: string }[];
};

type Props = {
    /** Fixed day (Y-m-d): hides the day picker */
    date?: string;
    /** Fixed patient: hides the patient picker */
    patient?: { id: number; name: string };
    /** Fixed slot (Y-m-d H:i:s inside `date`): only that slot is offered */
    startsAt?: string;
    onDismiss: () => void;
};

export default function AssignModal({ date, patient, startsAt, onDismiss }: Props) {
    const [day, setDay] = useState<string | null>(date ?? null);
    const [options, setOptions] = useState<AssignOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [patientId, setPatientId] = useState(patient ? String(patient.id) : '');
    const [specialtyId, setSpecialtyId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadFailed(false);

        fetch(`/agenda/assign-options${day ? `?date=${day}` : ''}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            signal: controller.signal,
        })
            .then((response) => (response.ok ? (response.json() as Promise<AssignOptions>) : Promise.reject(response)))
            .then((data) => {
                setOptions(data);
                setSpecialtyId((current) => current || (data.specialties.length === 1 ? String(data.specialties[0].id) : ''));
                setLoading(false);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setLoadFailed(true);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [day]);

    const assign = (startsAt: string) => {
        if (!patientId || !specialtyId) {
            return;
        }
        setError(null);
        router.post(
            '/agenda/appointments',
            { starts_at: startsAt, patient_id: Number(patientId), specialty_id: Number(specialtyId) },
            {
                preserveScroll: true,
                onStart: () => setSubmitting(true),
                onFinish: () => setSubmitting(false),
                onSuccess: onDismiss,
                onError: (errors) => setError(Object.values(errors)[0] ?? 'No se pudo asignar el turno.'),
            },
        );
    };

    const shownDate = options?.date ?? date ?? null;
    const slots = startsAt ? (options?.slots ?? []).filter((slot) => slot.starts_at === startsAt) : (options?.slots ?? []);
    const message =
        [patient?.name, date ? formatDateLabel(date) : null, startsAt ? `${wallTime(startsAt)} hs` : null].filter(Boolean).join(' · ') ||
        'Elegí paciente, especialidad y horario.';

    return (
        <ConfirmDialog title="Asignar turno" message={message} onDismiss={onDismiss} className={date ? undefined : 'w-[min(30rem,100%)]'}>
            <div className="flex max-h-[60dvh] min-h-0 flex-col">
                {!patient ? (
                    <Field label="Paciente vinculado" htmlFor="assign_patient_id" className="shrink-0">
                        <Combobox
                            id="assign_patient_id"
                            value={patientId}
                            placeholder="Elegí un paciente"
                            searchLabel="Buscar por nombre o DNI"
                            onChange={(value) => {
                                setPatientId(value);
                                setError(null);
                            }}
                            disabled={!options}
                            options={[
                                { value: '', label: 'Elegí un paciente' },
                                ...(options?.patients ?? []).map((option) => ({
                                    value: String(option.id),
                                    label: `${option.name} · DNI ${option.dni}`,
                                })),
                            ]}
                        />
                    </Field>
                ) : null}
                <Field label="Especialidad" htmlFor="assign_specialty_id" className="shrink-0">
                    <Combobox
                        id="assign_specialty_id"
                        value={specialtyId}
                        placeholder="Elegí una especialidad"
                        onChange={(value) => {
                            setSpecialtyId(value);
                            setError(null);
                        }}
                        disabled={!options}
                        options={[
                            { value: '', label: 'Elegí una especialidad' },
                            ...(options?.specialties ?? []).map((specialty) => ({ value: String(specialty.id), label: specialty.name })),
                        ]}
                    />
                </Field>
                {!date && options && options.days.length > 0 ? (
                    <Field label="Día" htmlFor="assign_day" className="shrink-0">
                        <Combobox
                            id="assign_day"
                            value={shownDate ?? ''}
                            placeholder="Elegí un día"
                            onChange={(value) => value && setDay(value)}
                            options={options.days.map((option) => ({ value: option, label: formatDateLabel(option) }))}
                        />
                    </Field>
                ) : null}
                {error ? <FieldError className="shrink-0">{error}</FieldError> : null}
                {!date ? (
                    loadFailed ? (
                        <Empty>No se pudieron cargar los horarios.</Empty>
                    ) : !options ? (
                        <Hint>Cargando horarios…</Hint>
                    ) : options.days.length === 0 ? (
                        <Empty>No hay huecos libres en los próximos días.</Empty>
                    ) : (
                        <DayTimeline
                            className={cn('min-h-[14rem] flex-1', (loading || submitting) && 'pointer-events-none opacity-60')}
                            date={options.date}
                            now={options.timeline.now}
                            stepMinutes={options.slotMinutes}
                            label="Franjas, reservas y huecos libres del día"
                            bands={options.timeline.windows.map((window) => ({
                                key: window.id,
                                starts_at: window.starts_at,
                                ends_at: window.ends_at,
                            }))}
                            blocks={options.timeline.appointments.map((appointment) => ({
                                key: appointment.id,
                                starts_at: appointment.starts_at,
                                ends_at: appointment.ends_at,
                                title: appointment.patient?.name ?? 'Paciente',
                                subtitle: appointment.specialty?.name,
                            }))}
                            freeSlots={options.slots}
                            onFreeSelect={(slotStartsAt) => {
                                if (!patientId || !specialtyId) {
                                    setError(patientId ? 'Elegí una especialidad.' : 'Elegí un paciente.');
                                    return;
                                }
                                assign(slotStartsAt);
                            }}
                        />
                    )
                ) : (
                    <PanelScroll className="pt-0">
                        {loadFailed ? (
                            <Empty>No se pudieron cargar los horarios.</Empty>
                        ) : loading && !options ? (
                            <Hint>Cargando horarios…</Hint>
                        ) : slots.length === 0 ? (
                            <Empty>{startsAt ? 'Ese horario ya no está libre.' : 'No hay huecos libres este día.'}</Empty>
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
                                        disabled={!patientId || !specialtyId || submitting || loading}
                                        onClick={() => assign(slot.starts_at)}
                                    >
                                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Asignar
                                    </Btn>
                                </SlotRow>
                            ))
                        )}
                    </PanelScroll>
                )}
            </div>
            <div className="flex justify-end">
                <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={onDismiss}>
                    <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Volver
                </Btn>
            </div>
        </ConfirmDialog>
    );
}
