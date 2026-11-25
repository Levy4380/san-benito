import BookingCard from '@/Components/Surfaces/BookingCard';
import { SurgeryStatusBadge } from '@/Components/Surgeries/SurgeryDetailDialog';
import { surgeryRange, surgeryShortDate } from '@/lib/surgery';
import { canSeeAppointmentProfessional } from '@/lib/roles';
import type { SharedData, SurgeryRecord } from '@/types';
import { usePage } from '@inertiajs/react';

/** Surgery row in every list (staff/professional sections, buscador): same shell as appointment cards, click opens the detail. */
export default function SurgeryCard({ surgery, onOpen }: { surgery: SurgeryRecord; onOpen: (id: number) => void }) {
    const showProfessional = canSeeAppointmentProfessional(usePage<SharedData>().props.auth.user?.roles ?? []);

    return (
        <BookingCard as="button" className="items-start text-left" onClick={() => onOpen(surgery.id)} aria-label="Ver detalle de la cirugía">
            {surgery.starts_at && surgery.ends_at ? (
                <span className="text-sm text-ink-2">
                    {surgeryShortDate(surgery.starts_at.slice(0, 10))} · {surgeryRange(surgery.starts_at, surgery.ends_at)}
                </span>
            ) : null}
            <strong className="text-ink">{surgery.patient?.name}</strong>
            <span className="text-sm text-ink-2">
                DNI <span className="font-mono">{surgery.patient?.dni}</span>
            </span>
            {showProfessional ? <span className="text-sm text-ink-2">Solicita: {surgery.professional?.user.name}</span> : null}
            <SurgeryStatusBadge surgery={surgery} className="mt-[0.3rem]" />
        </BookingCard>
    );
}
