import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Time24Input } from '@/components/time-24-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de agenda',
        href: '/settings/agenda',
    },
];

const WEEKDAYS: { value: number; label: string }[] = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
];

type WeeklyBand = {
    weekday: number;
    start: string;
    end: string;
};

type Props = {
    doctor: {
        id: number;
        slot_duration_minutes: number;
        weekly_availability: WeeklyBand[];
    };
};

export default function AgendaSettings({ doctor }: Props) {
    const { flash, errors: pageErrors } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        slot_duration_minutes: doctor.slot_duration_minutes,
        weekly_availability: doctor.weekly_availability ?? [],
    });

    const canGenerate = (doctor.weekly_availability?.length ?? 0) > 0;

    const bandsByDay = useMemo(() => {
        const map: Record<number, { band: WeeklyBand; index: number }[]> = {};
        WEEKDAYS.forEach((day) => {
            map[day.value] = [];
        });
        data.weekly_availability.forEach((band, index) => {
            map[band.weekday]?.push({ band, index });
        });
        return map;
    }, [data.weekly_availability]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.agenda.update'));
    };

    const addBand = (weekday: number) => {
        setData('weekly_availability', [
            ...data.weekly_availability,
            { weekday, start: '09:00', end: '12:00' },
        ]);
    };

    const updateBand = (index: number, field: 'start' | 'end', value: string) => {
        const next = data.weekly_availability.map((band, i) =>
            i === index ? { ...band, [field]: value } : band,
        );
        setData('weekly_availability', next);
    };

    const removeBand = (index: number) => {
        setData(
            'weekly_availability',
            data.weekly_availability.filter((_, i) => i !== index),
        );
    };

    const generateMonth = (target: 'current' | 'next') => {
        router.post(route('settings.agenda.generate'), { target }, { preserveScroll: true });
    };

    const weeklyError =
        (errors.weekly_availability as string | undefined) ||
        (pageErrors.weekly_availability as string | undefined);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de agenda" />

            <SettingsLayout>
                <div className="space-y-10">
                    <form onSubmit={submit} className="space-y-10">
                        <div className="space-y-6">
                            <HeadingSmall
                                title="Duración de turnos"
                                description="Definí cuántos minutos dura cada turno. Se usa al crear turnos clásicos, al dividir franjas y al generar el mes."
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="slot_duration_minutes">Duración estándar (minutos)</Label>

                                <Input
                                    id="slot_duration_minutes"
                                    type="number"
                                    min={5}
                                    max={120}
                                    step={1}
                                    className="mt-1 block w-full"
                                    value={data.slot_duration_minutes}
                                    onChange={(e) => setData('slot_duration_minutes', Number(e.target.value))}
                                    required
                                />

                                <p className="text-sm text-neutral-600">Entre 5 y 120 minutos. Por defecto: 20.</p>

                                <InputError className="mt-2" message={errors.slot_duration_minutes} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <HeadingSmall
                                title="Franjas semanales"
                                description="Horarios que se repiten cada semana. Guardá la plantilla y después generá el mes actual o el siguiente."
                            />

                            <InputError message={weeklyError} />

                            <div className="space-y-6">
                                {WEEKDAYS.map((day) => (
                                    <div key={day.value} className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-medium text-[var(--color-ink)]">{day.label}</h3>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addBand(day.value)}
                                            >
                                                Agregar franja
                                            </Button>
                                        </div>

                                        {(bandsByDay[day.value] ?? []).length === 0 ? (
                                            <p className="text-sm text-neutral-600">Sin franjas.</p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {(bandsByDay[day.value] ?? []).map(({ band, index }) => (
                                                    <li
                                                        key={`${day.value}-${index}`}
                                                        className="flex flex-wrap items-end gap-3"
                                                    >
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`start-${index}`}>Desde</Label>
                                                            <Time24Input
                                                                id={`start-${index}`}
                                                                value={band.start}
                                                                onChange={(value) => updateBand(index, 'start', value)}
                                                                required
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `weekly_availability.${index}.start`
                                                                    ] as string | undefined
                                                                }
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`end-${index}`}>Hasta</Label>
                                                            <Time24Input
                                                                id={`end-${index}`}
                                                                value={band.end}
                                                                onChange={(value) => updateBand(index, 'end', value)}
                                                                required
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `weekly_availability.${index}.end`
                                                                    ] as string | undefined
                                                                }
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeBand(index)}
                                                        >
                                                            Quitar
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Guardar</Button>

                            <Transition
                                show={recentlySuccessful || Boolean(flash.success)}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">{flash.success ?? 'Guardado'}</p>
                            </Transition>
                        </div>
                    </form>

                    <div className="space-y-4 border-t border-[var(--color-line)] pt-8">
                        <HeadingSmall
                            title="Generar turnos del mes"
                            description="Crea los turnos disponibles según la plantilla guardada. Los horarios pasados o ya ocupados se omiten."
                        />

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                type="button"
                                disabled={!canGenerate}
                                onClick={() => generateMonth('current')}
                            >
                                Generar mes actual
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!canGenerate}
                                onClick={() => generateMonth('next')}
                            >
                                Generar mes siguiente
                            </Button>
                        </div>

                        {!canGenerate && (
                            <p className="text-sm text-neutral-600">
                                Agregá y guardá al menos una franja para poder generar.
                            </p>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
