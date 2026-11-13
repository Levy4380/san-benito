import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import Hint from '@/Components/Surfaces/Hint';
import Surface from '@/Components/Surfaces/Surface';
import TextInput from '@/Components/Form/TextInput';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function UpdateAgenda({ slotDurationMinutes }: { slotDurationMinutes: number }) {
    const form = useForm({ slot_duration_minutes: slotDurationMinutes });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        form.patch('/agenda/settings', { preserveScroll: true });
    };

    return (
        <Surface as="form" onSubmit={submit}>
            <h2 className="mb-[0.15rem] text-[length:var(--text-md)]">Configuración de agenda</h2>
            <Hint className="mb-[var(--space-sm)]">Duración para partir las franjas. No cambia turnos ya cargados.</Hint>
            <Field label="Duración del turno (minutos)" htmlFor="slot_duration_minutes" error={form.errors.slot_duration_minutes}>
                <TextInput
                    id="slot_duration_minutes"
                    type="number"
                    min={5}
                    max={120}
                    value={form.data.slot_duration_minutes}
                    onChange={(event) => form.setData('slot_duration_minutes', Number(event.target.value))}
                />
            </Field>
            <div className="flex items-center gap-[var(--space-sm)]">
                <Btn type="submit" disabled={form.processing}>
                    <Save className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                    Guardar
                </Btn>
                {form.recentlySuccessful ? <Hint>Guardado.</Hint> : null}
            </div>
        </Surface>
    );
}
