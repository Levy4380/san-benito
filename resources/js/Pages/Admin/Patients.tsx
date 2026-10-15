import CreatePatientModal from '@/Components/Admin/CreatePatientModal';
import PatientAgendaModal from '@/Components/Admin/PatientAgendaModal';
import PatientInfoModal from '@/Components/Admin/PatientInfoModal';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Catalog from '@/Components/Surfaces/Catalog';
import type { FilterValues } from '@/Components/Surfaces/Filters';
import type { HealthInsurance, PatientRecord } from '@/types';
import { Head, router } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

type Props = {
    patients: PatientRecord[];
    healthInsurances: HealthInsurance[];
    filters: { q: string; health_insurance_id: string };
};

export default function AdminPatients({ patients, healthInsurances, filters }: Props) {
    const [creating, setCreating] = useState(false);
    const [infoId, setInfoId] = useState<number | null>(null);
    const [agendaId, setAgendaId] = useState<number | null>(null);
    const hasFilters = filters.q.trim() !== '' || (filters.health_insurance_id !== '' && filters.health_insurance_id !== 'all');

    const agenda = patients.find((patient) => patient.id === agendaId) ?? null;

    const apply = (data: FilterValues) => {
        router.get('/admin/pacientes', data, { preserveState: true });
    };

    return (
        <>
            <Head title="Pacientes" />
            <PageScreen
                header={
                    <PageHeader
                        title="Pacientes"
                        description="Alta de pacientes. Solo super admin."
                        actions={
                            <Btn type="button" onClick={() => setCreating(true)}>
                                <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Crear paciente
                            </Btn>
                        }
                    />
                }
            >
                <StageCard>
                    <Catalog
                        applied={{ health_insurance_id: filters.health_insurance_id || 'all' }}
                        onApply={apply}
                        empty={hasFilters ? 'No hay pacientes con esos filtros.' : 'Todavía no hay pacientes.'}
                        items={patients.map((patient) => ({
                            key: patient.id,
                            title: patient.name,
                            lines: [patient.email, `DNI ${patient.dni}`, patient.health_insurance ?? 'Particular'],
                            actions: [
                                { kind: 'info', name: patient.name, onClick: () => setInfoId(patient.id) },
                                { kind: 'agenda', name: patient.name, onClick: () => setAgendaId(patient.id) },
                            ],
                        }))}
                        primary={
                            <Field label="Buscar" htmlFor="q" flush className="min-w-0">
                                <TextInput id="q" name="q" defaultValue={filters.q} placeholder="Nombre, DNI o correo" />
                            </Field>
                        }
                        advanced={
                            <Field label="Obra social" htmlFor="filter_health_insurance_id" flush className="min-w-0">
                                <Combobox
                                    id="filter_health_insurance_id"
                                    name="health_insurance_id"
                                    defaultValue={filters.health_insurance_id || 'all'}
                                    options={[
                                        { value: 'all', label: 'Todas' },
                                        ...healthInsurances.map((healthInsurance) => ({
                                            value: String(healthInsurance.id),
                                            label: healthInsurance.name,
                                        })),
                                    ]}
                                />
                            </Field>
                        }
                    />
                </StageCard>
            </PageScreen>
            {creating ? <CreatePatientModal onDismiss={() => setCreating(false)} /> : null}
            {infoId !== null ? (
                <PatientInfoModal
                    patientId={infoId}
                    onDismiss={() => setInfoId(null)}
                    onOpenAgenda={() => {
                        setAgendaId(infoId);
                        setInfoId(null);
                    }}
                />
            ) : null}
            {agenda ? <PatientAgendaModal patientId={agenda.id} name={agenda.name} onDismiss={() => setAgendaId(null)} /> : null}
        </>
    );
}
