import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import AssociateHealthInsurancesForm from '@/Components/Professionals/AssociateHealthInsurancesForm';
import AssociateSpecialtiesForm from '@/Components/Professionals/AssociateSpecialtiesForm';
import ProfessionalProfileFields from '@/Components/Professionals/ProfessionalProfileFields';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import { getJson } from '@/lib/json';
import { hasPermission, Permission } from '@/lib/permissions';
import type { HealthInsurance, ProfessionalRecord, SharedData, Specialty } from '@/types';
import { usePage } from '@inertiajs/react';
import { Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    professional: ProfessionalRecord;
    specialties: Specialty[];
    onDismiss: () => void;
    onOpenAgenda: () => void;
};

export default function ProfessionalInfoModal({ professional, specialties, onDismiss, onOpenAgenda }: Props) {
    const { auth } = usePage<SharedData>().props;
    const canAssociateSpecialties = hasPermission(auth.user?.permissions, Permission.SpecialtiesManage);
    const canAssociateHealthInsurances = hasPermission(auth.user?.permissions, Permission.HealthInsurancesManage);
    const [editing, setEditing] = useState<'specialties' | 'insurances' | null>(null);

    const editButton = (panel: 'specialties' | 'insurances') => (
        <Btn type="button" size="xs" variant="outline" className="shrink-0" onClick={() => setEditing(panel)}>
            Editar
        </Btn>
    );

    return (
        <>
            <ConfirmDialog
                title={professional.user.name}
                message="Datos del profesional."
                onDismiss={onDismiss}
                className="flex max-h-[calc(100dvh-2rem)] w-[min(32rem,100%)] min-h-0 flex-col overflow-hidden max-md:max-h-[calc(100dvh-var(--space-sm)*2))]"
            >
                <div className="max-h-[min(60dvh,calc(100dvh-10rem))] overflow-y-auto">
                    <ProfessionalProfileFields
                        professional={professional}
                        specialtyAction={canAssociateSpecialties ? editButton('specialties') : undefined}
                        healthInsuranceAction={canAssociateHealthInsurances ? editButton('insurances') : undefined}
                    />
                </div>
                <div className="flex flex-wrap justify-end gap-[0.55rem]">
                    <Btn type="button" onClick={onOpenAgenda}>
                        Ver agenda
                    </Btn>
                    <Btn type="button" variant="outline" onClick={onDismiss}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                </div>
            </ConfirmDialog>
            {editing === 'specialties' ? (
                <ConfirmDialog
                    title="Especialidades"
                    message={professional.user.name}
                    onDismiss={() => setEditing(null)}
                    className="flex max-h-[calc(100dvh-2rem)] w-[min(32rem,100%)] min-h-0 flex-col overflow-hidden"
                >
                    <AssociateSpecialtiesForm professional={professional} specialties={specialties} onSaved={() => setEditing(null)} />
                    <div className="flex justify-end">
                        <Btn type="button" variant="outline" onClick={() => setEditing(null)}>
                            <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                            Volver
                        </Btn>
                    </div>
                </ConfirmDialog>
            ) : null}
            {editing === 'insurances' ? (
                <HealthInsuranceEditor professional={professional} onDismiss={() => setEditing(null)} />
            ) : null}
        </>
    );
}

function HealthInsuranceEditor({ professional, onDismiss }: { professional: ProfessionalRecord; onDismiss: () => void }) {
    const [options, setOptions] = useState<HealthInsurance[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setOptions(null);
        setFailed(false);

        getJson<{ healthInsurances: HealthInsurance[] }>(`/admin/profesionales/${professional.id}/obras-sociales`, controller.signal)
            .then((payload) => setOptions(payload.healthInsurances))
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [professional.id]);

    const assigned = professional.health_insurances ?? [];

    return (
        <ConfirmDialog
            title="Obras sociales"
            message={professional.user.name}
            onDismiss={onDismiss}
            className="flex max-h-[calc(100dvh-2rem)] w-[min(32rem,100%)] min-h-0 flex-col overflow-hidden"
        >
            {failed ? (
                <Empty>No se pudieron cargar las obras sociales.</Empty>
            ) : options === null ? (
                <Hint>Cargando…</Hint>
            ) : (
                <AssociateHealthInsurancesForm
                    professional={{ ...professional, health_insurances: assigned }}
                    healthInsurances={options}
                    onSaved={onDismiss}
                />
            )}
            <div className="flex justify-end">
                <Btn type="button" variant="outline" onClick={onDismiss}>
                    <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Volver
                </Btn>
            </div>
        </ConfirmDialog>
    );
}
