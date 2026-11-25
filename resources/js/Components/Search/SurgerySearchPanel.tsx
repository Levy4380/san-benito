import SurgeryCard from '@/Components/Surgeries/SurgeryCard';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import {
    SearchCriterionForm,
    SearchHub,
    surgeryCriteria,
    type SearchCriterion,
} from '@/Components/Search/SearchCriteria';
import { Btn } from '@/Components/Form/Btn';
import Empty from '@/Components/Surfaces/Empty';
import Filters, { type FilterValues } from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import type { HealthInsurance, ProfessionalRecord, Specialty, SurgeryRecord } from '@/types';
import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type Paginator = {
    data: SurgeryRecord[];
    prev_page_url: string | null;
    next_page_url: string | null;
};

type FiltersState = {
    q: string;
    specialty_id: number | null;
    professional_id: number | null;
    health_insurance_id: number | string | null;
    status: string | null;
    date: string | null;
};

type Props = {
    path: string;
    includeProfessional: boolean;
    surgeries: Paginator;
    filters: FiltersState;
    by: SearchCriterion | null;
    professionals: ProfessionalRecord[];
    specialties: Specialty[];
    healthInsurances: HealthInsurance[];
    onOpen: (id: number) => void;
};

function lockedLabel(
    by: SearchCriterion,
    filters: FiltersState,
    professionals: ProfessionalRecord[],
    healthInsurances: HealthInsurance[],
): string {
    if (by === 'date') {
        return filters.date ?? '';
    }
    if (by === 'professional') {
        return professionals.find((item) => item.id === filters.professional_id)?.user.name ?? '';
    }
    if (by === 'patient') {
        return filters.q;
    }
    if (filters.health_insurance_id === 'particular') {
        return 'Particular';
    }

    return healthInsurances.find((item) => item.id === filters.health_insurance_id)?.name ?? '';
}

export default function SurgerySearchPanel({
    path,
    includeProfessional,
    surgeries,
    filters,
    by,
    professionals,
    specialties,
    healthInsurances,
    onOpen,
}: Props) {
    const criteria = useMemo(() => surgeryCriteria(includeProfessional), [includeProfessional]);
    const [draft, setDraft] = useState<SearchCriterion | null>(null);
    const [draftDate, setDraftDate] = useState('');
    const [draftProfessional, setDraftProfessional] = useState('');
    const [draftPatient, setDraftPatient] = useState('');
    const [draftInsurance, setDraftInsurance] = useState('');

    const searched = by != null;
    const display = useMemo(
        () => (by ? lockedLabel(by, filters, professionals, healthInsurances) : ''),
        [by, filters, professionals, healthInsurances],
    );

    const apply = (data: FilterValues) => {
        router.get(path, data, { preserveState: true });
    };

    const clear = () => {
        setDraft(null);
        router.get(path, {}, { preserveState: false });
    };

    const openDraft = (key: SearchCriterion) => {
        setDraft(key);
        setDraftDate('');
        setDraftProfessional('');
        setDraftPatient('');
        setDraftInsurance('');
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
        } else if (draft === 'patient' && draftPatient.trim() !== '') {
            payload.q = draftPatient.trim();
        } else if (draft === 'insurance' && draftInsurance) {
            payload.health_insurance_id = draftInsurance;
        } else {
            return;
        }

        router.get(path, payload, { preserveState: true });
    };

    const applied: FilterValues = {};
    if (searched && by) {
        if (by !== 'date' && filters.date) {
            applied.date = filters.date;
        }
        if (includeProfessional && by !== 'professional' && filters.professional_id != null) {
            applied.professional_id = String(filters.professional_id);
        }
        if (by !== 'patient' && filters.q.trim() !== '') {
            applied.q = filters.q;
        }
        if (by !== 'insurance' && filters.health_insurance_id != null && filters.health_insurance_id !== '') {
            applied.health_insurance_id = String(filters.health_insurance_id);
        }
        if (filters.specialty_id != null) {
            applied.specialty_id = String(filters.specialty_id);
        }
    }

    const hasFilters =
        filters.q.trim() !== '' ||
        filters.specialty_id != null ||
        filters.professional_id != null ||
        (filters.health_insurance_id != null && filters.health_insurance_id !== '') ||
        filters.date != null;

    return (
        <>
            {!searched && draft == null ? <SearchHub options={criteria} onSelect={openDraft} /> : null}

            {!searched && draft != null ? (
                <SearchCriterionForm
                    title={criteria.find((item) => item.key === draft)?.label ?? ''}
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
                            <TextInput
                                id="draft-patient"
                                type="search"
                                placeholder="Nombre o DNI"
                                value={draftPatient}
                                onChange={(event) => setDraftPatient(event.target.value)}
                                autoComplete="off"
                                required
                            />
                        </Field>
                    ) : null}
                    {draft === 'insurance' ? (
                        <Field label="Obra social" htmlFor="draft-insurance" flush>
                            <Combobox
                                id="draft-insurance"
                                value={draftInsurance}
                                onChange={setDraftInsurance}
                                options={[
                                    { value: '', label: 'Elegí una obra social…' },
                                    ...healthInsurances.map((insurance) => ({
                                        value: String(insurance.id),
                                        label: insurance.name,
                                    })),
                                    { value: 'particular', label: 'Particular' },
                                ]}
                            />
                        </Field>
                    ) : null}
                </SearchCriterionForm>
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
                                label={criteria.find((item) => item.key === by)?.label ?? ''}
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
                                {by === 'patient' ? <input type="hidden" name="q" value={filters.q} /> : null}
                                {by === 'insurance' ? (
                                    <input type="hidden" name="health_insurance_id" value={String(filters.health_insurance_id ?? '')} />
                                ) : null}
                            </Field>
                        }
                        advanced={
                            <>
                                {by !== 'date' ? (
                                    <Field label="Fecha" htmlFor="surgery-date" flush className="min-w-0">
                                        <TextInput id="surgery-date" name="date" type="date" defaultValue={filters.date ?? ''} />
                                    </Field>
                                ) : null}
                                {by !== 'patient' ? (
                                    <Field label="Paciente" htmlFor="surgery-q" flush className="min-w-0">
                                        <TextInput
                                            id="surgery-q"
                                            name="q"
                                            type="search"
                                            placeholder="Nombre o DNI"
                                            defaultValue={filters.q}
                                            autoComplete="off"
                                        />
                                    </Field>
                                ) : null}
                                <Field label="Especialidad" htmlFor="surgery-specialty" flush className="min-w-0">
                                    <Combobox
                                        id="surgery-specialty"
                                        name="specialty_id"
                                        defaultValue={filters.specialty_id != null ? String(filters.specialty_id) : ''}
                                        options={[
                                            { value: '', label: 'Todas' },
                                            ...specialties.map((specialty) => ({
                                                value: String(specialty.id),
                                                label: specialty.name,
                                            })),
                                        ]}
                                    />
                                </Field>
                                {includeProfessional && by !== 'professional' ? (
                                    <Field label="Profesional" htmlFor="surgery-professional" flush className="min-w-0">
                                        <Combobox
                                            id="surgery-professional"
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
                                {by !== 'insurance' ? (
                                    <Field label="Obra social" htmlFor="surgery-insurance" flush className="min-w-0">
                                        <Combobox
                                            id="surgery-insurance"
                                            name="health_insurance_id"
                                            defaultValue={
                                                filters.health_insurance_id != null ? String(filters.health_insurance_id) : ''
                                            }
                                            options={[
                                                { value: '', label: 'Todas' },
                                                ...healthInsurances.map((insurance) => ({
                                                    value: String(insurance.id),
                                                    label: insurance.name,
                                                })),
                                                { value: 'particular', label: 'Particular' },
                                            ]}
                                        />
                                    </Field>
                                ) : null}
                            </>
                        }
                    >
                        {surgeries.data.length === 0 ? (
                            <Empty>{hasFilters ? 'No hay cirugías con esos filtros.' : 'No hay cirugías en esta sección.'}</Empty>
                        ) : (
                            <div className="grid gap-[var(--space-sm)]">
                                {surgeries.data.map((surgery) => (
                                    <SurgeryCard key={surgery.id} surgery={surgery} onOpen={onOpen} />
                                ))}
                            </div>
                        )}
                        {surgeries.prev_page_url || surgeries.next_page_url ? (
                            <div className="mt-[var(--space-sm)] flex justify-end gap-[var(--space-sm)]">
                                {surgeries.prev_page_url ? (
                                    <Btn asChild variant="outline" size="sm">
                                        <Link href={surgeries.prev_page_url}>Anterior</Link>
                                    </Btn>
                                ) : null}
                                {surgeries.next_page_url ? (
                                    <Btn asChild variant="outline" size="sm">
                                        <Link href={surgeries.next_page_url}>Siguiente</Link>
                                    </Btn>
                                ) : null}
                            </div>
                        ) : null}
                    </Filters>
                </Results>
            ) : null}
        </>
    );
}
