import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import RequestSurgeryModal from '@/Components/Surgeries/RequestSurgeryModal';
import SurgeryDetailDialog, { SurgeryStatusBadge } from '@/Components/Surgeries/SurgeryDetailDialog';
import Empty from '@/Components/Surfaces/Empty';
import Filters, { type FilterValues } from '@/Components/Surfaces/Filters';
import Results from '@/Components/Surfaces/Results';
import { hasPermission, Permission } from '@/lib/permissions';
import { surgeryRange, surgeryShortDate } from '@/lib/surgery';
import type { HealthInsurance, ProfessionalRecord, SharedData, Specialty, SurgeryRecord, SurgerySection } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Plus } from 'lucide-react';
import { useState } from 'react';

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
};

type Props = {
    section: SurgerySection;
    surgeries: Paginator;
    filters: FiltersState;
    openSurgery: SurgeryRecord | null;
    professionals: ProfessionalRecord[];
    specialties: Specialty[];
    healthInsurances: HealthInsurance[];
};

const SECTIONS: Record<SurgerySection, { title: string; subtitle: string }> = {
    pending: {
        title: 'Pendientes',
        subtitle: 'Cirugías de obra social que todavía no se solicitaron a la obra social.',
    },
    requested: {
        title: 'Solicitadas',
        subtitle: 'Enviadas a la obra social; la respuesta se carga a mano.',
    },
    approved: {
        title: 'Aprobadas',
        subtitle: 'A programar y programadas que todavía no terminaron.',
    },
    history: {
        title: 'Historial',
        subtitle: 'Cirugías programadas que ya pasaron.',
    },
};

export default function AdminSurgeries({
    section,
    surgeries,
    filters,
    openSurgery,
    professionals,
    specialties,
    healthInsurances,
}: Props) {
    const page = usePage<SharedData>();
    const copy = SECTIONS[section];
    const { ask, dialog } = useConfirm();
    const [openId, setOpenId] = useState<number | null>(openSurgery?.id ?? null);
    const [requesting, setRequesting] = useState(false);
    const listed = surgeries.data.find((surgery) => surgery.id === openId) ?? null;
    const openRecord = listed ?? (openSurgery?.id === openId ? openSurgery : null);
    const canCreate = hasPermission(page.props.auth.user?.permissions, Permission.SurgeriesCreate);
    const hasFilters =
        filters.q.trim() !== '' ||
        filters.specialty_id != null ||
        filters.professional_id != null ||
        (filters.health_insurance_id != null && filters.health_insurance_id !== '') ||
        (section === 'approved' && filters.status != null && filters.status !== '');

    const apply = (data: FilterValues) => {
        router.get('/admin/cirugias', { section, ...data }, { preserveState: true });
    };

    const approve = async (surgery: SurgeryRecord) => {
        setOpenId(null);
        const ok = await ask({
            title: 'Aprobar cirugía',
            message: 'Pasa a «A programar» y sigue sin horario.',
            confirmLabel: 'Aprobar',
        });

        if (ok) {
            router.post(`/admin/cirugias/${surgery.id}/aprobar`, {}, { preserveState: false });
        } else {
            setOpenId(surgery.id);
        }
    };

    const applied: FilterValues = {
        specialty_id: filters.specialty_id != null ? String(filters.specialty_id) : '',
        professional_id: filters.professional_id != null ? String(filters.professional_id) : '',
        health_insurance_id: filters.health_insurance_id != null ? String(filters.health_insurance_id) : '',
    };

    if (section === 'approved') {
        applied.status = filters.status ?? '';
    }

    return (
        <>
            <Head title={copy.title} />
            <PageScreen
                header={
                    <PageHeader
                        title={copy.title}
                        description={copy.subtitle}
                        actions={
                            <>
                                <Btn asChild variant="outline">
                                    <Link href={`/admin/cirugias/calendario?from=${section}`}>
                                        <Calendar className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Calendario
                                    </Link>
                                </Btn>
                                {canCreate ? (
                                    <Btn type="button" onClick={() => setRequesting(true)}>
                                        <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Solicitar cirugía
                                    </Btn>
                                ) : null}
                            </>
                        }
                    />
                }
            >
                <StageCard>
                    <Results>
                        <Filters
                            applied={applied}
                            onApply={apply}
                            primary={
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
                            }
                            advanced={
                                <>
                                    {section === 'approved' ? (
                                        <Field label="Estado" htmlFor="surgery-status" flush className="min-w-0">
                                            <Combobox
                                                id="surgery-status"
                                                name="status"
                                                defaultValue={filters.status ?? ''}
                                                options={[
                                                    { value: '', label: 'Todos' },
                                                    { value: 'to_schedule', label: 'A programar' },
                                                    { value: 'scheduled', label: 'Programada' },
                                                ]}
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
                                                ...specialties.map((specialty) => ({ value: String(specialty.id), label: specialty.name })),
                                            ]}
                                        />
                                    </Field>
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
                                    <Field label="Obra social" htmlFor="surgery-insurance" flush className="min-w-0">
                                        <Combobox
                                            id="surgery-insurance"
                                            name="health_insurance_id"
                                            defaultValue={filters.health_insurance_id != null ? String(filters.health_insurance_id) : ''}
                                            options={[
                                                { value: '', label: 'Todas' },
                                                ...healthInsurances.map((insurance) => ({ value: String(insurance.id), label: insurance.name })),
                                                { value: 'particular', label: 'Particular' },
                                            ]}
                                        />
                                    </Field>
                                </>
                            }
                        >
                            {surgeries.data.length === 0 ? (
                                <Empty>{hasFilters ? 'No hay cirugías con esos filtros.' : 'No hay cirugías en esta sección.'}</Empty>
                            ) : (
                                <div className="grid gap-[var(--space-sm)]">
                                    {surgeries.data.map((surgery) => (
                                        <div key={surgery.id} className="grid gap-[var(--space-sm)]">
                                            {surgery.opens_scheduled_group ? (
                                                <div role="separator" className="pt-[var(--space-xs)] text-sm font-semibold text-ink">
                                                    Programadas
                                                </div>
                                            ) : null}
                                            <article className="flex min-w-0 flex-col gap-[0.35rem] rounded-lg border border-rule bg-paper-2 px-[0.7rem] py-[0.55rem] sm:flex-row sm:items-center sm:justify-between">
                                                <div className="grid min-w-0 justify-items-start gap-[0.15rem]">
                                                    {surgery.starts_at && surgery.ends_at ? (
                                                        <div className="text-sm text-ink-2">
                                                            {surgeryShortDate(surgery.starts_at.slice(0, 10))} · {surgeryRange(surgery.starts_at, surgery.ends_at)}
                                                        </div>
                                                    ) : null}
                                                    <div className="font-display text-sm font-semibold text-ink">{surgery.patient?.name}</div>
                                                    <div className="text-sm text-ink-2">
                                                        DNI <span className="font-mono">{surgery.patient?.dni}</span>
                                                    </div>
                                                    <div className="text-sm text-ink-2">Solicita: {surgery.professional?.user.name}</div>
                                                    <SurgeryStatusBadge status={surgery.status} />
                                                </div>
                                                <Btn type="button" variant="outline" size="sm" onClick={() => setOpenId(surgery.id)}>
                                                    Ver detalle
                                                </Btn>
                                            </article>
                                        </div>
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
                </StageCard>
            </PageScreen>
            {openRecord ? (
                <SurgeryDetailDialog surgery={openRecord} section={section} onDismiss={() => setOpenId(null)} onApprove={approve} />
            ) : null}
            {requesting ? <RequestSurgeryModal onDismiss={() => setRequesting(false)} /> : null}
            {dialog}
        </>
    );
}
