import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
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

type Props = {
    doctor: {
        id: number;
        slot_duration_minutes: number;
    };
};

export default function AgendaSettings({ doctor }: Props) {
    const { flash } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        slot_duration_minutes: doctor.slot_duration_minutes,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('settings.agenda.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de agenda" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Duración de turnos"
                        description="Definí cuántos minutos dura cada turno. Se usa al crear turnos clásicos y al dividir franjas."
                    />

                    <form onSubmit={submit} className="space-y-6">
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

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Guardar</Button>

                            <Transition
                                show={recentlySuccessful || Boolean(flash.success)}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Guardado</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
