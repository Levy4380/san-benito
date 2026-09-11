import { Link } from '@inertiajs/react';
import { User } from 'lucide-react';
import { Btn } from '@/Components/Form/Btn';
import { cn } from '@/lib/utils';

type Props = {
    patientId: number;
    name?: string;
    className?: string;
    size?: 'sm' | 'xs';
    label?: string;
};

export default function PatientProfileBtn({
    patientId,
    name,
    className,
    size = 'sm',
    label = 'Ver perfil',
}: Props) {
    const aria = name ? `${label} de ${name}` : label;

    return (
        <Btn variant="outline" size={size} className={cn('shrink-0', className)} asChild>
            <Link href={`/my-patients/${patientId}`} aria-label={aria} title={aria}>
                <User className={cn('shrink-0', size === 'xs' ? 'size-3' : 'size-[1.05rem]')} aria-hidden strokeWidth={2} />
                {label}
            </Link>
        </Btn>
    );
}
