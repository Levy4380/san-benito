import { usePage } from '@inertiajs/react';
import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { focusVisibleClass } from '@/lib/clinico-control';
import { wallDate, wallTime } from '@/lib/datetime';
import { canSeeAppointmentDoctor, canSeeAppointmentPatient } from '@/lib/roles';
import { cn } from '@/lib/utils';
import type { AppointmentRecord, SharedData } from '@/types';

const bookingCardClass =
    'flex min-w-0 flex-col gap-[0.15rem] rounded-lg border border-rule bg-paper-2 px-[0.7rem] py-[0.4rem] font-inherit text-ink no-underline transition-[border-color] duration-short ease-out [&_h3]:text-sm [&_h3]:[overflow-wrap:anywhere] [&_strong]:font-display [&_strong]:text-sm [&_strong]:font-semibold [&_button]:shrink-0';

type Common = {
    children: ReactNode;
    className?: string;
    asChild?: boolean;
};

type DivProps = Common &
    HTMLAttributes<HTMLDivElement> & {
        as?: 'div';
    };

type ButtonProps = Common &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        as: 'button';
    };

type Props = DivProps | ButtonProps;

export default function BookingCard({ as = 'div', asChild = false, className, children, ...props }: Props) {
    const interactive = as === 'button' || asChild;
    const classes = cn(bookingCardClass, interactive ? cn('cursor-pointer hover:border-accent', focusVisibleClass) : null, className);

    if (asChild) {
        return (
            <Slot className={classes} {...props}>
                {children}
            </Slot>
        );
    }

    if (as === 'button') {
        return (
            <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
                {children}
            </button>
        );
    }

    return (
        <div className={classes} {...(props as HTMLAttributes<HTMLDivElement>)}>
            {children}
        </div>
    );
}

export function BookingList({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('grid min-h-0 w-full flex-1 content-start gap-[0.5rem] overflow-y-auto mt-2', className)}>
            {children}
        </div>
    );
}

export function BookingCardRow({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex min-w-0 items-start justify-between gap-[0.4rem]', className)}>{children}</div>;
}

export function BookingCardActions({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex shrink-0 flex-col items-stretch gap-[0.2rem]', className)}>{children}</div>;
}

export function BookingCardFields({ appointment, className }: { appointment: AppointmentRecord; className?: string }) {
    const roles = usePage<SharedData>().props.auth.user?.roles ?? [];
    const showDoctor = canSeeAppointmentDoctor(roles);
    const showPatient = canSeeAppointmentPatient(roles);

    return (
        <dl className={cn('m-0 grid min-w-0 gap-[0.1rem] text-sm', className)}>
            <BookingCardField label="Fecha" value={wallDate(appointment.starts_at)} mono />
            <BookingCardField label="Hora" value={`${wallTime(appointment.starts_at)} — ${wallTime(appointment.ends_at)}`} mono />
            {showDoctor ? <BookingCardField label="Doctor" value={appointment.doctor?.user.name} /> : null}
            <BookingCardField label="Especialidad" value={appointment.specialty?.name} />
            {showPatient ? <BookingCardField label="Paciente" value={appointment.patient?.user.name} /> : null}
        </dl>
    );
}

function BookingCardField({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
    return (
        <div className="min-w-0 truncate">
            <dt className="inline text-ink-2">{label}: </dt>
            <dd className={cn('inline m-0 text-ink', mono && 'font-mono')}>{value ?? ''}</dd>
        </div>
    );
}
