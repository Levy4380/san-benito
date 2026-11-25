import StatusBadge, { type StatusTone } from '@/Components/Common/StatusBadge';
import { Btn } from '@/Components/Form/Btn';
import { APPOINTMENT_STATUS_LABEL, appointmentStarted, appointmentStatus } from '@/lib/appointment-status';
import { hasPermission, Permission } from '@/lib/permissions';
import type { AppointmentAttendance, AppointmentRecord, AppointmentStatusName, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Check, RotateCcw, UserX } from 'lucide-react';
import { useState } from 'react';

const BADGE_STYLE: Record<AppointmentStatusName, StatusTone> = {
    scheduled: { background: 'oklch(88% 0.06 250)', color: 'oklch(32% 0.08 250)' },
    past: { background: 'oklch(92% 0.01 250)', color: 'oklch(40% 0.02 250)' },
    attended: { background: 'oklch(90% 0.08 150)', color: 'oklch(36% 0.1 150)' },
    absent: { background: 'oklch(90% 0.06 25)', color: 'oklch(42% 0.14 25)' },
};

export function AppointmentStatusBadge({ status, className }: { status: AppointmentStatusName; className?: string }) {
    return (
        <StatusBadge tone={BADGE_STYLE[status]} status={status} className={className}>
            {APPOINTMENT_STATUS_LABEL[status]}
        </StatusBadge>
    );
}

/** Staff (`appointments.attendance`) or the professional of the agenda (`own.appointments.attendance`; server checks ownership). */
export function useCanMarkAttendance(): boolean {
    const permissions = usePage<SharedData>().props.auth.user?.permissions;

    return (
        hasPermission(permissions, Permission.AppointmentsAttendance) ||
        hasPermission(permissions, Permission.OwnAppointmentsAttendance)
    );
}

/**
 * Local attendance state for a dialog: starts from the server value and follows the PATCH
 * (pages fed by JSON — agenda modals — don't reload their data after `back()`).
 */
export function useAppointmentAttendance(appointment: AppointmentRecord, onChanged?: () => void) {
    const [local, setLocal] = useState<{ attendance: AppointmentAttendance | null } | null>(null);
    const [saving, setSaving] = useState(false);

    const attendance = local ? local.attendance : appointment.attendance;
    const status = local ? appointmentStatus(appointment.starts_at, local.attendance) : appointment.status;

    const mark = (next: AppointmentAttendance | null) => {
        router.patch(
            `/appointments/${appointment.id}/attendance`,
            { attendance: next },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    setLocal({ attendance: next });
                    onChanged?.();
                },
            },
        );
    };

    return { attendance, status, saving, mark };
}

type ControlsProps = {
    appointment: AppointmentRecord;
    attendance: AppointmentAttendance | null;
    saving: boolean;
    onMark: (next: AppointmentAttendance | null) => void;
};

/** Atendido / Ausente, as footer actions of «Detalle del turno». Hidden until the appointment started. */
const OK_TONE =
    'border-ok/35 bg-ok-faint text-ok hover:border-ok hover:bg-ok-soft hover:text-ok disabled:hover:border-ok/35 disabled:hover:bg-ok-faint disabled:hover:text-ok';
const DANGER_TONE =
    'border-danger/35 bg-danger-faint text-danger hover:border-danger hover:bg-danger-soft hover:text-danger disabled:hover:border-danger/35 disabled:hover:bg-danger-faint disabled:hover:text-danger';

export function AppointmentAttendanceControls({ appointment, attendance, saving, onMark }: ControlsProps) {
    if (!appointmentStarted(appointment.starts_at)) {
        return null;
    }

    return (
        <>
            <Btn
                type="button"
                variant={attendance === 'attended' ? 'primary' : 'outline'}
                aria-pressed={attendance === 'attended'}
                disabled={saving || attendance === 'attended'}
                className={attendance === 'attended' ? undefined : OK_TONE}
                onClick={() => onMark('attended')}
            >
                <Check className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Atendido
            </Btn>
            <Btn
                type="button"
                variant={attendance === 'absent' ? 'primary' : 'outline'}
                aria-pressed={attendance === 'absent'}
                disabled={saving || attendance === 'absent'}
                className={attendance === 'absent' ? undefined : DANGER_TONE}
                onClick={() => onMark('absent')}
            >
                <UserX className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                Ausente
            </Btn>
        </>
    );
}

/** Small «Quitar marca» shown next to the status badge while there is an explicit mark. */
export function ClearAttendanceBtn({ attendance, saving, onMark }: Omit<ControlsProps, 'appointment'>) {
    if (!attendance) {
        return null;
    }

    return (
        <Btn type="button" size="xs" variant="outline" disabled={saving} onClick={() => onMark(null)}>
            <RotateCcw className="size-3 shrink-0" aria-hidden strokeWidth={2} />
            Quitar marca
        </Btn>
    );
}
