import AppointmentDetailDialog from '@/Components/Appointments/AppointmentDetailDialog';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import {
    appointmentCriteria,
    HistoryCriterionForm,
    HistorySearchHub,
    type HistoryCriterion,
} from '@/Components/History/HistorySearch';
import BookingCard, { BookingCardFields, BookingCardRow, BookingList } from '@/Components/Surfaces/BookingCard';
import Empty from '@/Components/Surfaces/Empty';
import Filters, { type FilterValues } from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { hasPermission, Permission } from '@/lib/permissions';
import type { AppointmentRecord, PatientRecord, ProfessionalRecord, SharedData, Specialty } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type Paginator = {
    data: AppointmentRecord[];
};

type FiltersState = {
    professional_id: number | null;
    patient_id: number | null;
    specialty_id: number | null;
    date: string | null;
};

type Props = {
    appointments: Paginator;
    filters: FiltersState;
    by: HistoryCriterion | null;
    professionals: ProfessionalRecord[];
    patients: PatientRecord[];
    specialties: Specialty[];
};

const PATH = '/admin/historial/turnos';
const CRITERIA = appointmentCriteria(true);

function fixedKey(by: HistoryCriterion): keyof FiltersState {
    if (by === 'professional') {
        return 'professional_id';
    }
    if (by === 'patient') {
        return 'patient_id';
    }
    if (by === 'specialty') {
        return 'specialty_id';
    }

    return 'date';
}

function lockedLabel(
    by: HistoryCriterion,
    filters: FiltersState,
    professionals: ProfessionalRecord[],
    patients: PatientRecord[],
    specialties: Specialty[],
): string {
    if (by === 'date') {
        return filters.date ?? '';
    }
    if (by === 'professional') {
        return professionals.find((item) => item.id === filters.professional_id)?.user.name ?? '';
    }
    if (by === 'patient') {
        return patients.find((item) => item.id === filters.patient_id)?.name ?? '';
    }

    return specialties.find((item) => item.id === filters.specialty_id)?.name ?? '';
}

export default function AdminAppointments({ appointments, filters, by, professionals, patients, specialties }: Props) {
    const { auth } = usePage<SharedData>().props;
    const canViewPatient = hasPermission(auth.user?.permissions, Permission.PatientsCatalogView);
    const [draft, setDraft] = useState<HistoryCriterion | null>(null);
    const [draftDate, setDraftDate] = useState('');
    const [draftProfessional, setDraftProfessional] = useState('');
    const [draftPatient, setDraftPatient] = useState('');
    const [draftSpecialty, setDraftSpecialty] = useState('');
    const [openId, setOpenId] = useState<number | null>(null);
    const open = appointments.data.find((appointment) => appointment.id === openId) ?? null;

    const searched = by != null;
    const display = useMemo(
        () => (by ? lockedLabel(by, filters, professionals, patients, specialties) : ''),
        [by, filters, professionals, patients, specialties],
    );

    const apply = (data: FilterValues) => {
        const next = { ...data };
        if (next.specialty_id === 'all') {
            delete next.specialty_id;
        }
        router.get(PATH, next, { preserveState: true });
    };

    const clear = () => {
        setDraft(null);
        router.get(PATH, {}, { preserveState: false });
    };

    const openDraft = (key: HistoryCriterion) => {
        setDraft(key);
        setDraftDate('');
        setDraftProfessional('');
        setDraftPatient('');
        setDraftSpecialty('');
    };

    const searchCriterion = () => {
        if (!draft) {
            return;
        }

        const payload: FilterValues = { by: draft };

        if (draft === 'date' && draftDate) {
            payload.date = draftDate;
        } else if (draft === 'professional' && draftProfessional) {
            payload.professional_id = draftProfessional;
        } else if (draft === 'patient' && draftPatient) {
            payload.patient_id = draftPatient;
        } else if (draft === 'specialty' && draftSpecialty) {
            payload.specialty_id = draftSpecialty;
        } else {
            return;
        }

        router.get(PATH, payload, { preserveState: true });
    };

    const applied: FilterValues = {};
    if (searched && by) {
        const locked = fixedKey(by);
        if (locked !== 'date' && filters.date) {
            applied.date = filters.date;
        }
        if (locked !== 'professional_id' && filters.professional_id != null) {
            applied.professional_id = String(filters.professional_id);
        }
        if (locked !== 'patient_id' && filters.patient_id != null) {
            applied.patient_id = String(filters.patient_id);
        }
        if (locked !== 'specialty_id') {
            applied.specialty_id = filters.specialty_id != null ? String(filters.specialty_id) : 'all';
        }
    }

    return (
        <>
            <Head title="Historial de turnos" />
            <PageScreen header={<PageHeader title="Historial de turnos" description="Turnos cuyo horario de inicio ya pasó." />}>
                <StageCard>
                    {!searched && draft == null ? <HistorySearchHub options={CRITERIA} onSelect={openDraft} /> : null}

                    {!searched && draft != null ? (
                        <HistoryCriterionForm
                            title={CRITERIA.find((item) => item.key === draft)?.label ?? ''}
                            onBack={() => setDraft(null)}
                            onSubmit={searchCriterion}
                        >
                            {draft === 'date' ? (
                                <Field label="Fecha" htmlFor="draft-date" flush>
                                    <TextInput
                                        id="draft-date"
                                        type="date"
                                        value={draftDate}
                                        onChange={(event) => setDraftDate(event.target.value)}
                                        required
                                    />
                                </Field>
                            ) : null}
                            {draft === 'professional' ? (
                                <Field label="Doctor" htmlFor="draft-professional" flush>
                                    <Combobox
                                        id="draft-professional"
                                        value={draftProfessional}
                                        onChange={setDraftProfessional}
                                        options={[
                                            { value: '', label: 'Elegí un doctor…' },
                                            ...professionals.map((professional) => ({
                                                value: String(professional.id),
                                                label: professional.user.name,
                                            })),
                                        ]}
                                    />
                                </Field>
                            ) : null}
                            {draft === 'patient' ? (
                                <Field label="Paciente" htmlFor="draft-patient" flush>
                                    <Combobox
                                        id="draft-patient"
                                        value={draftPatient}
                                        onChange={setDraftPatient}
                                        options={[
                                            { value: '', label: 'Elegí un paciente…' },
                                            ...patients.map((patient) => ({ value: String(patient.id), label: patient.name })),
                                        ]}
                                    />
                                </Field>
                            ) : null}
                            {draft === 'specialty' ? (
                                <Field label="Especialidad" htmlFor="draft-specialty" flush>
                                    <Combobox
                                        id="draft-specialty"
                                        value={draftSpecialty}
                                        onChange={setDraftSpecialty}
                                        options={[
                                            { value: '', label: 'Elegí una especialidad…' },
                                            ...specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name })),
                                        ]}
                                    />
                                </Field>
                            ) : null}
                        </HistoryCriterionForm>
                    ) : null}

                    {searched && by ? (
                        <Results>
                            <Filters
                                locked
                                onClear={clear}
                                applied={applied}
                                onApply={apply}
                                primary={
                                    <Field
                                        label={CRITERIA.find((item) => item.key === by)?.label ?? ''}
                                        htmlFor="locked-primary"
                                        flush
                                        className="min-w-0"
                                    >
                                        <TextInput id="locked-primary" readOnly value={display} className="bg-paper-2" />
                                        <input type="hidden" name="by" value={by} />
                                        {by === 'date' ? <input type="hidden" name="date" value={filters.date ?? ''} /> : null}
                                        {by === 'professional' ? (
                                            <input type="hidden" name="professional_id" value={String(filters.professional_id ?? '')} />
                                        ) : null}
                                        {by === 'patient' ? (
                                            <input type="hidden" name="patient_id" value={String(filters.patient_id ?? '')} />
                                        ) : null}
                                        {by === 'specialty' ? (
                                            <input type="hidden" name="specialty_id" value={String(filters.specialty_id ?? '')} />
                                        ) : null}
                                    </Field>
                                }
                                advanced={
                                    <>
                                        {by !== 'date' ? (
                                            <Field label="Fecha" htmlFor="date" flush className="min-w-0">
                                                <TextInput id="date" name="date" type="date" defaultValue={filters.date ?? ''} />
                                            </Field>
                                        ) : null}
                                        {by !== 'professional' ? (
                                            <Field label="Profesional" htmlFor="professional_id" flush className="min-w-0">
                                                <Combobox
                                                    id="professional_id"
                                                    name="professional_id"
                                                    defaultValue={filters.professional_id != null ? String(filters.professional_id) : ''}
                                                    options={[
                                                        { value: '', label: 'Todos' },
                                                        ...professionals.map((professional) => ({
                                                            value: String(professional.id),
                                                            label: professional.user.name,
                                                        })),
                                                    ]}
                                                />
                                            </Field>
                                        ) : null}
                                        {by !== 'patient' ? (
                                            <Field label="Paciente" htmlFor="patient_id" flush className="min-w-0">
                                                <Combobox
                                                    id="patient_id"
                                                    name="patient_id"
                                                    defaultValue={filters.patient_id != null ? String(filters.patient_id) : ''}
                                                    options={[
                                                        { value: '', label: 'Todos' },
                                                        ...patients.map((patient) => ({ value: String(patient.id), label: patient.name })),
                                                    ]}
                                                />
                                            </Field>
                                        ) : null}
                                        {by !== 'specialty' ? (
                                            <Field label="Especialidad" htmlFor="specialty_id" flush className="min-w-0">
                                                <Combobox
                                                    id="specialty_id"
                                                    name="specialty_id"
                                                    defaultValue={filters.specialty_id != null ? String(filters.specialty_id) : 'all'}
                                                    options={[
                                                        { value: 'all', label: 'Todas' },
                                                        ...specialties.map((specialty) => ({
                                                            value: String(specialty.id),
                                                            label: specialty.name,
                                                        })),
                                                    ]}
                                                />
                                            </Field>
                                        ) : null}
                                    </>
                                }
                            >
                                {appointments.data.length === 0 ? (
                                    <Empty>No hay turnos pasados con esos filtros.</Empty>
                                ) : (
                                    <BookingList className="mt-0">
                                        {appointments.data.map((appointment) => (
                                            <BookingCard
                                                key={appointment.id}
                                                as="button"
                                                onClick={() => setOpenId(appointment.id)}
                                                aria-label="Ver detalle del turno"
                                            >
                                                <BookingCardRow>
                                                    <BookingCardFields appointment={appointment} />
                                                </BookingCardRow>
                                            </BookingCard>
                                        ))}
                                    </BookingList>
                                )}
                            </Filters>
                        </Results>
                    ) : null}
                </StageCard>
            </PageScreen>
            {open ? (
                <AppointmentDetailDialog
                    appointment={open}
                    onDismiss={() => setOpenId(null)}
                    profileHref={canViewPatient ? `/admin/pacientes/${open.patient_id}` : null}
                />
            ) : null}
        </>
    );
}
