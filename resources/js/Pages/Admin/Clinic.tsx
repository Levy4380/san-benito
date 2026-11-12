import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import Time24 from '@/Components/Form/Time24';
import Hint from '@/Components/Surfaces/Hint';
import Results from '@/Components/Surfaces/Results';
import type { ClinicSchedule } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';

const DAYS: { iso: number; label: string }[] = [
    { iso: 1, label: 'Lunes' },
    { iso: 2, label: 'Martes' },
    { iso: 3, label: 'Miércoles' },
    { iso: 4, label: 'Jueves' },
    { iso: 5, label: 'Viernes' },
    { iso: 6, label: 'Sábado' },
    { iso: 7, label: 'Domingo' },
];

type Props = {
    clinic: ClinicSchedule;
};

export default function AdminClinic({ clinic }: Props) {
    const form = useForm({
        open_days: clinic.openDays,
        opens_at: clinic.opensAt,
        closes_at: clinic.closesAt,
    });

    const toggleDay = (iso: number, checked: boolean) => {
        form.setData(
            'open_days',
            checked ? [...form.data.open_days, iso].sort((a, b) => a - b) : form.data.open_days.filter((day) => day !== iso),
        );
    };

    return (
        <>
            <Head title="Sanatorio" />
            <PageScreen
                header={
                    <PageHeader
                        title="Sanatorio"
                        description="Días y horario en los que el centro está abierto."
                        backHref="/admin/configuracion"
                        backLabel="Configuración"
                    />
                }
            >
                <StageCard>
                    <Results className="gap-[var(--space-md)]">
                        <form
                            className="grid min-h-0 flex-1 content-start gap-[var(--space-md)] overflow-auto"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.patch('/admin/configuracion/sanatorio');
                            }}
                        >
                            <fieldset className="grid gap-[0.45rem]">
                                <legend className="text-sm leading-[1.3] font-medium text-ink">Días</legend>
                                <div className="flex flex-wrap gap-x-[1rem] gap-y-[0.45rem]">
                                    {DAYS.map((day) => (
                                        <CheckLabel
                                            key={day.iso}
                                            checked={form.data.open_days.includes(day.iso)}
                                            onChange={(checked) => toggleDay(day.iso, checked)}
                                        >
                                            {day.label}
                                        </CheckLabel>
                                    ))}
                                </div>
                                {form.errors.open_days ? <p className="text-sm text-danger">{form.errors.open_days}</p> : null}
                            </fieldset>
                            <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
                                <Field label="Abre" htmlFor="clinic-opens-h" error={form.errors.opens_at} flush>
                                    <Time24 id="clinic-opens" value={form.data.opens_at} onChange={(value) => form.setData('opens_at', value)} />
                                </Field>
                                <Field label="Cierra" htmlFor="clinic-closes-h" error={form.errors.closes_at} flush>
                                    <Time24 id="clinic-closes" value={form.data.closes_at} onChange={(value) => form.setData('closes_at', value)} />
                                </Field>
                            </div>
                            <Hint className="m-0">
                                Un día cerrado no se puede programar. Las franjas tienen que entrar en este horario, y las líneas de tiempo lo usan como escala.
                            </Hint>
                            <Btn type="submit" disabled={form.processing} className="justify-self-start">
                                <Check className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                Guardar
                            </Btn>
                        </form>
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
