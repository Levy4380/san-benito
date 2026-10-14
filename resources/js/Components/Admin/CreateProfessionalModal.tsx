import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import Empty from '@/Components/Surfaces/Empty';
import Hint from '@/Components/Surfaces/Hint';
import type { HealthInsurance, Specialty } from '@/types';
import { useForm } from '@inertiajs/react';
import { Undo2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

type CreateProfessionalOptions = {
    specialties: Specialty[];
    healthInsurances: HealthInsurance[];
};

type Props = {
    onDismiss: () => void;
};

export default function CreateProfessionalModal({ onDismiss }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        license_number: '',
        specialty_ids: [] as number[],
        health_insurance_ids: [] as number[],
    });
    const [options, setOptions] = useState<CreateProfessionalOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadFailed(false);

        fetch('/professionals/create', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            signal: controller.signal,
        })
            .then((response) => (response.ok ? (response.json() as Promise<CreateProfessionalOptions>) : Promise.reject(response)))
            .then((data) => {
                setOptions(data);
                setLoading(false);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setLoadFailed(true);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, []);

    return (
        <ConfirmDialog title="Crear profesional" message="Alta de profesionales." onDismiss={onDismiss} className="w-[min(48rem,100%)]">
            <form
                className="grid min-h-0"
                onSubmit={(event) => {
                    event.preventDefault();
                    setErrors({});
                    form.post('/professionals', {
                        preserveScroll: true,
                        onSuccess: () => onDismiss(),
                        onError: (next) => setErrors(next),
                    });
                }}
            >
                <div className="grid max-h-[60dvh] content-start gap-x-[var(--space-md)] overflow-auto md:grid-cols-2">
                    {loadFailed ? (
                        <Empty>No se pudieron cargar los datos.</Empty>
                    ) : loading || !options ? (
                        <Hint>Cargando…</Hint>
                    ) : (
                        <>
                            <Field label="Nombre" htmlFor="create_professional_name" error={errors.name}>
                                <TextInput
                                    id="create_professional_name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    required
                                />
                            </Field>
                            <Field label="Correo" htmlFor="create_professional_email" error={errors.email}>
                                <TextInput
                                    id="create_professional_email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    required
                                />
                            </Field>
                            <Field label="Contraseña" htmlFor="create_professional_password" error={errors.password}>
                                <TextInput
                                    id="create_professional_password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                    required
                                />
                            </Field>
                            <Field label="Matrícula" htmlFor="create_professional_license_number" error={errors.license_number}>
                                <TextInput
                                    id="create_professional_license_number"
                                    value={form.data.license_number}
                                    onChange={(event) => form.setData('license_number', event.target.value)}
                                    required
                                />
                            </Field>
                            <Field label="Especialidades" htmlFor="specialty_ids" error={errors.specialty_ids}>
                                <Combobox
                                    id="specialty_ids"
                                    multiple
                                    value={form.data.specialty_ids.map(String)}
                                    placeholder="Elegí especialidades"
                                    searchLabel="Buscar especialidad"
                                    empty="Todavía no hay especialidades."
                                    emptyFiltered="No hay especialidades con ese nombre."
                                    onChange={(values) => form.setData('specialty_ids', values.map(Number))}
                                    options={options.specialties.map((specialty) => ({
                                        value: String(specialty.id),
                                        label: specialty.name,
                                    }))}
                                />
                            </Field>
                            <Field label="Obras sociales (opcional)" htmlFor="health_insurance_ids" error={errors.health_insurance_ids}>
                                <Combobox
                                    id="health_insurance_ids"
                                    multiple
                                    value={form.data.health_insurance_ids.map(String)}
                                    placeholder="Elegí obras sociales"
                                    searchLabel="Buscar obra social"
                                    empty="Todavía no hay obras sociales."
                                    emptyFiltered="No hay obras sociales con ese nombre."
                                    onChange={(values) => form.setData('health_insurance_ids', values.map(Number))}
                                    options={options.healthInsurances.map((healthInsurance) => ({
                                        value: String(healthInsurance.id),
                                        label: healthInsurance.name,
                                    }))}
                                />
                            </Field>
                        </>
                    )}
                </div>
                <div className="mt-[0.25rem] flex flex-wrap justify-end gap-[0.5rem]">
                    <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={onDismiss}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                    <Btn type="submit" className="min-w-[6.5rem]" disabled={form.processing || loading || loadFailed}>
                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Crear profesional
                    </Btn>
                </div>
            </form>
        </ConfirmDialog>
    );
}
