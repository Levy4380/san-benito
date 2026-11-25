import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import { useConfirm } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Time24 from '@/Components/Form/Time24';
import Hint from '@/Components/Surfaces/Hint';
import ListRow from '@/Components/Surfaces/ListRow';
import Results from '@/Components/Surfaces/Results';
import { formatDateLabel } from '@/lib/datetime';
import type { ClinicException, ClinicSchedule } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Check, Plus, Trash2 } from 'lucide-react';

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

function exceptionHours(item: ClinicException): string {
    if (item.closed || !item.opensAt || !item.closesAt) {
        return 'Cerrado';
    }

    return `${item.opensAt}–${item.closesAt}`;
}

export default function AdminClinic({ clinic }: Props) {
    const form = useForm({
        open_days: clinic.openDays,
        opens_at: clinic.opensAt,
        closes_at: clinic.closesAt,
    });
    const exception = useForm({
        date: '',
        closed: true,
        opens_at: '08:00',
        closes_at: '13:00',
        label: '',
    });
    const { ask, dialog } = useConfirm();

    const toggleDay = (iso: number, checked: boolean) => {
        form.setData(
            'open_days',
            checked ? [...form.data.open_days, iso].sort((a, b) => a - b) : form.data.open_days.filter((day) => day !== iso),
        );
    };

    const addException = () => {
        exception.transform((data) => ({
            date: data.date,
            closed: data.closed,
            label: data.label.trim() === '' ? null : data.label.trim(),
            opens_at: data.closed ? null : data.opens_at,
            closes_at: data.closed ? null : data.closes_at,
        }));
        exception.post('/admin/configuracion/sanatorio/excepciones', {
            preserveScroll: true,
            onSuccess: () => exception.reset('date', 'label'),
        });
    };

    const removeException = async (item: ClinicException) => {
        const ok = await ask({
            title: 'Quitar excepción',
            message: `¿Quitar la excepción del ${formatDateLabel(item.date)}?`,
            confirmLabel: 'Quitar',
            danger: true,
        });

        if (ok) {
            router.delete(`/admin/configuracion/sanatorio/excepciones/${item.id}`, { preserveScroll: true });
        }
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
                        <div className="grid min-h-0 flex-1 content-start gap-[var(--space-lg)] overflow-auto">
                            <form
                                className="grid content-start gap-[var(--space-md)]"
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

                            <section className="grid content-start gap-[var(--space-md)] border-t border-rule pt-[var(--space-md)]">
                                <div className="grid gap-[0.35rem]">
                                    <h2 className="text-sm leading-[1.3] font-medium text-ink">Excepciones</h2>
                                    <Hint className="m-0">
                                        Días puntuales en los que el sanatorio cierra o cambia de horario. El horario de arriba sigue igual el resto de los días.
                                    </Hint>
                                </div>
                                <form
                                    className="grid content-start gap-[var(--space-md)]"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        addException();
                                    }}
                                >
                                    <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
                                        <Field label="Día" htmlFor="exception-date" error={exception.errors.date} flush>
                                            <TextInput
                                                id="exception-date"
                                                type="date"
                                                value={exception.data.date}
                                                onChange={(event) => exception.setData('date', event.target.value)}
                                                required
                                            />
                                        </Field>
                                        <Field label="Motivo" htmlFor="exception-label" error={exception.errors.label} hint="Opcional." flush>
                                            <TextInput
                                                id="exception-label"
                                                value={exception.data.label}
                                                maxLength={80}
                                                placeholder="Feriado, Nochebuena…"
                                                onChange={(event) => exception.setData('label', event.target.value)}
                                            />
                                        </Field>
                                    </div>
                                    <CheckLabel checked={exception.data.closed} onChange={(checked) => exception.setData('closed', checked)}>
                                        Cerrado
                                    </CheckLabel>
                                    {exception.data.closed ? null : (
                                        <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
                                            <Field label="Abre" htmlFor="exception-opens-h" error={exception.errors.opens_at} flush>
                                                <Time24
                                                    id="exception-opens"
                                                    value={exception.data.opens_at}
                                                    onChange={(value) => exception.setData('opens_at', value)}
                                                />
                                            </Field>
                                            <Field label="Cierra" htmlFor="exception-closes-h" error={exception.errors.closes_at} flush>
                                                <Time24
                                                    id="exception-closes"
                                                    value={exception.data.closes_at}
                                                    onChange={(value) => exception.setData('closes_at', value)}
                                                />
                                            </Field>
                                        </div>
                                    )}
                                    <Btn type="submit" disabled={exception.processing || exception.data.date === ''} className="justify-self-start">
                                        <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        Agregar
                                    </Btn>
                                </form>
                                {clinic.exceptions.length === 0 ? (
                                    <p className="m-0 text-sm text-ink-2">Todavía no hay excepciones.</p>
                                ) : (
                                    <div className="grid gap-[0.45rem]">
                                        {clinic.exceptions.map((item) => (
                                            <ListRow key={item.id}>
                                                <span>
                                                    <strong>{formatDateLabel(item.date)}</strong>
                                                    <span className="mt-[0.15rem] block text-sm text-ink-2">
                                                        {item.label ? `${item.label} · ` : ''}
                                                        {exceptionHours(item)}
                                                    </span>
                                                </span>
                                                <Btn type="button" variant="outline" size="sm" onClick={() => removeException(item)}>
                                                    <Trash2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                                    Quitar
                                                </Btn>
                                            </ListRow>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </Results>
                </StageCard>
            </PageScreen>
            {dialog}
        </>
    );
}
