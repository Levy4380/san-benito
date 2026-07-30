import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Time24Input } from '@/components/time-24-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

type GenerateTarget = 'current' | 'next' | 'after_next';

type GenerateMonth = {
    target: GenerateTarget;
    label: string;
};

type Props = {
    doctor: {
        id: number;
        slot_duration_minutes: number;
        weekly_availability: WeeklyBand[];
    };
    generateMonths: GenerateMonth[];
};

function cloneBands(bands: WeeklyBand[]): WeeklyBand[] {
    return bands.map((band) => ({ ...band }));
}

export default function AgendaSettings({ doctor, generateMonths }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<GenerateMonth | null>(null);

    const durationForm = useForm({
        slot_duration_minutes: doctor.slot_duration_minutes,
    });

    const generateForm = useForm<{
        target: GenerateTarget;
        weekly_availability: WeeklyBand[];
    }>({
        target: 'current',
        weekly_availability: cloneBands(doctor.weekly_availability ?? []),
    });

    const bandsByDay = useMemo(() => {
        const map: Record<number, { band: WeeklyBand; index: number }[]> = {};
        WEEKDAYS.forEach((day) => {
            map[day.value] = [];
        });
        generateForm.data.weekly_availability.forEach((band, index) => {
            map[band.weekday]?.push({ band, index });
        });
        return map;
    }, [generateForm.data.weekly_availability]);

    const submitDuration: FormEventHandler = (e) => {
        e.preventDefault();
        durationForm.patch(route('settings.agenda.update'));
    };

    const openMonthModal = (month: GenerateMonth) => {
        setSelectedMonth(month);
        generateForm.setData({
            target: month.target,
            weekly_availability: cloneBands(doctor.weekly_availability ?? []),
        });
        generateForm.clearErrors();
        setModalOpen(true);
    };

    const addBand = (weekday: number) => {
        generateForm.setData('weekly_availability', [
            ...generateForm.data.weekly_availability,
            { weekday, start: '09:00', end: '12:00' },
        ]);
    };

    const updateBand = (index: number, field: 'start' | 'end', value: string) => {
        generateForm.setData(
            'weekly_availability',
            generateForm.data.weekly_availability.map((band, i) =>
                i === index ? { ...band, [field]: value } : band,
            ),
        );
    };

    const removeBand = (index: number) => {
        generateForm.setData(
            'weekly_availability',
            generateForm.data.weekly_availability.filter((_, i) => i !== index),
        );
    };

    const submitGenerate: FormEventHandler = (e) => {
        e.preventDefault();
        generateForm.post(route('settings.agenda.generate'), {
            preserveScroll: true,
            onSuccess: () => setModalOpen(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de agenda" />

            <SettingsLayout>
                <div className="space-y-10">
                    <form onSubmit={submitDuration} className="space-y-6">
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
                                value={durationForm.data.slot_duration_minutes}
                                onChange={(e) =>
                                    durationForm.setData('slot_duration_minutes', Number(e.target.value))
                                }
                                required
                            />

                            <p className="text-sm text-neutral-600">Entre 5 y 120 minutos. Por defecto: 20.</p>

                            <InputError className="mt-2" message={durationForm.errors.slot_duration_minutes} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={durationForm.processing}>Guardar</Button>

                            <Transition
                                show={durationForm.recentlySuccessful || Boolean(flash.success)}
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
                            title="Crear turnos"
                            description="Elegí el mes. Se abre un modal para definir las franjas semanales y crear los turnos."
                        />

                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-[var(--color-ink)]">Crear turnos para:</span>
                            {generateMonths.map((month) => (
                                <Button
                                    key={month.target}
                                    type="button"
                                    variant="outline"
                                    onClick={() => openMonthModal(month)}
                                >
                                    {month.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <Dialog
                    open={modalOpen}
                    onOpenChange={(open) => {
                        setModalOpen(open);
                        if (!open) {
                            setSelectedMonth(null);
                        }
                    }}
                >
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Franjas semanales para {selectedMonth?.label ?? 'el mes'}
                            </DialogTitle>
                            <DialogDescription>
                                Definí los horarios que se repiten cada semana. Al crear, se generan los turnos
                                del mes según la duración estándar. Los horarios pasados o ya ocupados se omiten.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitGenerate} className="space-y-6">
                            <InputError message={generateForm.errors.weekly_availability} />
                            <InputError message={generateForm.errors.target} />

                            <div className="space-y-6">
                                {WEEKDAYS.map((day) => (
                                    <div key={day.value} className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-medium text-[var(--color-ink)]">
                                                {day.label}
                                            </h3>
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
                                                            <Label htmlFor={`modal-start-${index}`}>Desde</Label>
                                                            <Time24Input
                                                                id={`modal-start-${index}`}
                                                                value={band.start}
                                                                onChange={(value) =>
                                                                    updateBand(index, 'start', value)
                                                                }
                                                                required
                                                            />
                                                            <InputError
                                                                message={
                                                                    generateForm.errors[
                                                                        `weekly_availability.${index}.start`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`modal-end-${index}`}>Hasta</Label>
                                                            <Time24Input
                                                                id={`modal-end-${index}`}
                                                                value={band.end}
                                                                onChange={(value) =>
                                                                    updateBand(index, 'end', value)
                                                                }
                                                                required
                                                            />
                                                            <InputError
                                                                message={
                                                                    generateForm.errors[
                                                                        `weekly_availability.${index}.end`
                                                                    ]
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

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setModalOpen(false)}
                                    disabled={generateForm.processing}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={generateForm.processing}>
                                    Crear turnos
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SettingsLayout>
        </AppLayout>
    );
}
