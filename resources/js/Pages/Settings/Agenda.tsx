import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import Surface from '@/Components/Surfaces/Surface';
import TextInput from '@/Components/Form/TextInput';

type Props = {
    slot_duration_minutes: number;
};

export default function AgendaSettings({ slot_duration_minutes }: Props) {
    const form = useForm({ slot_duration_minutes });

    return (
        <>
            <Head title="Configuración de agenda" />
            <PageScreen
                header={
                    <PageHeader
                        title="Configuración de agenda"
                        description="Duración para partir las franjas. No cambia turnos ya cargados."
                    />
                }
            >
                <Surface
                    as="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch('/settings/agenda');
                    }}
                >
                    <Field label="Duración del turno (minutos)" htmlFor="slot_duration_minutes">
                        <TextInput
                            id="slot_duration_minutes"
                            type="number"
                            min={5}
                            max={120}
                            value={form.data.slot_duration_minutes}
                            onChange={(event) => form.setData('slot_duration_minutes', Number(event.target.value))}
                        />
                    </Field>
                    <Btn type="submit" disabled={form.processing}>
                        <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Guardar
                    </Btn>
                </Surface>
            </PageScreen>
        </>
    );
}
