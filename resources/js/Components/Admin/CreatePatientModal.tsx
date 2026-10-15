import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import CheckLabel from '@/Components/Form/CheckLabel';
import Field from '@/Components/Form/Field';
import NativeSelect from '@/Components/Form/NativeSelect';
import TextInput from '@/Components/Form/TextInput';
import type { HealthInsurance } from '@/types';
import { useForm } from '@inertiajs/react';
import { Undo2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

type CreatePatientOptions = {
    healthInsurances: HealthInsurance[];
};

type Props = {
    onDismiss: () => void;
};

export default function CreatePatientModal({ onDismiss }: Props) {
    const form = useForm({
        with_account: false,
        name: '',
        email: '',
        password: '',
        dni: '',
        birth_date: '',
        phone: '',
        health_insurance_id: '',
    });
    const [options, setOptions] = useState<CreatePatientOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadFailed(false);

        fetch('/patients/create', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            signal: controller.signal,
        })
            .then((response) => (response.ok ? (response.json() as Promise<CreatePatientOptions>) : Promise.reject(response)))
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
        <ConfirmDialog title="Crear paciente" message="Alta de pacientes. Solo super admin." onDismiss={onDismiss} className="w-[min(48rem,100%)]">
            <form
                className="grid min-h-0"
                onSubmit={(event) => {
                    event.preventDefault();
                    setErrors({});
                    form.post('/patients', {
                        preserveScroll: true,
                        onSuccess: () => onDismiss(),
                        onError: (next) => setErrors(next),
                    });
                }}
            >
                <div className="grid max-h-[60dvh] content-start gap-x-[var(--space-md)] overflow-auto md:grid-cols-2">
                    <Field label="Nombre" htmlFor="create_patient_name" error={errors.name}>
                        <TextInput
                            id="create_patient_name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Correo" htmlFor="create_patient_email" error={errors.email}>
                        <TextInput
                            id="create_patient_email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                            required
                        />
                    </Field>
                    <CheckLabel
                        checked={form.data.with_account}
                        onChange={(checked) => form.setData('with_account', checked)}
                        className="mb-[var(--space-sm)] md:col-span-2"
                    >
                        Crear cuenta
                    </CheckLabel>
                    {form.data.with_account ? (
                        <Field label="Contraseña" htmlFor="create_patient_password" error={errors.password} className="md:col-span-2">
                            <TextInput
                                id="create_patient_password"
                                type="password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                required
                            />
                        </Field>
                    ) : null}
                    <Field label="DNI" htmlFor="create_patient_dni" error={errors.dni}>
                        <TextInput
                            id="create_patient_dni"
                            value={form.data.dni}
                            onChange={(event) => form.setData('dni', event.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Fecha de nacimiento" htmlFor="create_patient_birth_date" error={errors.birth_date}>
                        <TextInput
                            id="create_patient_birth_date"
                            type="date"
                            value={form.data.birth_date}
                            onChange={(event) => form.setData('birth_date', event.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Teléfono (opcional)" htmlFor="create_patient_phone" error={errors.phone}>
                        <TextInput
                            id="create_patient_phone"
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                        />
                    </Field>
                    <Field
                        label="Obra social (opcional)"
                        htmlFor="create_patient_health_insurance_id"
                        error={loadFailed ? 'No se pudieron cargar los datos.' : errors.health_insurance_id}
                    >
                        <NativeSelect
                            id="create_patient_health_insurance_id"
                            value={form.data.health_insurance_id}
                            disabled={loading || loadFailed}
                            onChange={(event) => form.setData('health_insurance_id', event.target.value)}
                        >
                            <option value="">Particular</option>
                            {(options?.healthInsurances ?? []).map((healthInsurance) => (
                                <option key={healthInsurance.id} value={healthInsurance.id}>
                                    {healthInsurance.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                </div>
                <div className="mt-[0.25rem] flex flex-wrap justify-end gap-[0.5rem]">
                    <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={onDismiss}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                    <Btn type="submit" className="min-w-[6.5rem]" disabled={form.processing}>
                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Crear paciente
                    </Btn>
                </div>
            </form>
        </ConfirmDialog>
    );
}
