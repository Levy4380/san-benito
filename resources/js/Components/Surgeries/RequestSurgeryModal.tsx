import { ConfirmDialog } from '@/Components/Feedback/ConfirmModal';
import { Btn } from '@/Components/Form/Btn';
import Combobox from '@/Components/Form/Combobox';
import Field from '@/Components/Form/Field';
import TextInput from '@/Components/Form/TextInput';
import { controlClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import type { HealthInsurance, ProfessionalRecord } from '@/types';
import { useForm } from '@inertiajs/react';
import { Plus, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type PatientHit = {
    id: number;
    name: string;
    dni: string;
    email: string;
    health_insurance_id: number | null;
};

type CreateOptions = {
    professionals: ProfessionalRecord[];
    healthInsurances: HealthInsurance[];
};

type Props = {
    onDismiss: () => void;
};

export default function RequestSurgeryModal({ onDismiss }: Props) {
    const form = useForm({
        patient_id: '' as number | '',
        health_insurance_id: 'particular',
        professional_id: '',
        note: '',
    });
    const [options, setOptions] = useState<CreateOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PatientHit[]>([]);
    const [searched, setSearched] = useState('');
    const [picked, setPicked] = useState<PatientHit | null>(null);
    const needle = query.trim();
    const tooShort = [...needle].length < 2;

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadFailed(false);

        fetch('/admin/cirugias/crear', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            signal: controller.signal,
        })
            .then((response) => (response.ok ? (response.json() as Promise<CreateOptions>) : Promise.reject(response)))
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

    useEffect(() => {
        if (tooShort) {
            setResults([]);
            setSearched('');

            return;
        }

        const controller = new AbortController();
        const handle = window.setTimeout(() => {
            fetch(`/admin/cirugias/pacientes?q=${encodeURIComponent(needle)}`, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
                .then((response) => response.json())
                .then((body: { patients?: PatientHit[] }) => {
                    setResults(body.patients ?? []);
                    setSearched(needle);
                })
                .catch(() => undefined);
        }, 200);

        return () => {
            window.clearTimeout(handle);
            controller.abort();
        };
    }, [needle, tooShort]);

    const choose = (patient: PatientHit) => {
        setPicked(patient);
        form.setData({
            ...form.data,
            patient_id: patient.id,
            health_insurance_id: patient.health_insurance_id != null ? String(patient.health_insurance_id) : 'particular',
        });
    };

    return (
        <ConfirmDialog
            title="Solicitar cirugía"
            message="Paciente, obra social, profesional y nota. Sin horario."
            onDismiss={onDismiss}
            className="w-[min(40rem,100%)]"
        >
            <form
                className="grid min-h-0"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        patient_id: data.patient_id,
                        professional_id: data.professional_id,
                        health_insurance_id:
                            data.health_insurance_id === '' || data.health_insurance_id === 'particular'
                                ? null
                                : Number(data.health_insurance_id),
                        note: data.note,
                    }));
                    form.post('/admin/cirugias', {
                        preserveScroll: true,
                        onSuccess: () => onDismiss(),
                    });
                }}
            >
                <div className="grid max-h-[60dvh] content-start gap-[var(--space-sm)] overflow-auto">
                    <Field label="Paciente" htmlFor="patient-q" error={form.errors.patient_id}>
                        <TextInput
                            id="patient-q"
                            value={query}
                            placeholder="Nombre, DNI o correo"
                            autoComplete="off"
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </Field>
                    <p className="m-0 text-sm text-ink-2">
                        {tooShort
                            ? 'Mínimo 2 caracteres.'
                            : searched === needle && results.length === 0
                              ? 'No hay pacientes con ese criterio.'
                              : null}
                    </p>
                    {results.length > 0 ? (
                        <div className="grid gap-[0.35rem]">
                            {results.map((patient) => (
                                <button
                                    key={patient.id}
                                    type="button"
                                    className="rounded-md border border-rule bg-paper px-[0.7rem] py-[0.45rem] text-left hover:border-accent"
                                    onClick={() => choose(patient)}
                                >
                                    <strong className="block text-sm text-ink">{patient.name}</strong>
                                    <span className="text-sm text-ink-2">
                                        DNI {patient.dni} · {patient.email}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                    {picked ? <p className="m-0 text-sm text-ink">Paciente elegido: {picked.name}</p> : null}
                    <Field label="Obra social" htmlFor="health-insurance-id" error={form.errors.health_insurance_id}>
                        <Combobox
                            id="health-insurance-id"
                            disabled={loading || loadFailed}
                            value={form.data.health_insurance_id}
                            placeholder={loading ? 'Cargando…' : undefined}
                            onChange={(value) => form.setData('health_insurance_id', value)}
                            options={[
                                { value: 'particular', label: 'Particular' },
                                ...(options?.healthInsurances ?? []).map((insurance) => ({
                                    value: String(insurance.id),
                                    label: insurance.name,
                                })),
                            ]}
                        />
                    </Field>
                    <Field
                        label="Profesional"
                        htmlFor="professional-id"
                        error={loadFailed ? 'No se pudieron cargar los datos.' : form.errors.professional_id}
                    >
                        <Combobox
                            id="professional-id"
                            disabled={loading || loadFailed}
                            value={form.data.professional_id}
                            onChange={(value) => form.setData('professional_id', value)}
                            placeholder={loading ? 'Cargando…' : 'Elegí un profesional'}
                            options={(options?.professionals ?? []).map((professional) => ({
                                value: String(professional.id),
                                label: professional.user.name,
                            }))}
                        />
                    </Field>
                    <Field label="Nota" htmlFor="surgery-note" error={form.errors.note}>
                        <textarea
                            id="surgery-note"
                            rows={4}
                            required
                            value={form.data.note}
                            onChange={(event) => form.setData('note', event.target.value)}
                            className={cn(controlClass(), 'h-auto min-h-[6.5rem] py-2')}
                        />
                    </Field>
                </div>
                <div className="mt-[0.25rem] flex flex-wrap justify-end gap-[0.5rem]">
                    <Btn type="button" variant="outline" className="min-w-[6.5rem]" onClick={onDismiss}>
                        <Undo2 className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Volver
                    </Btn>
                    <Btn type="submit" className="min-w-[6.5rem]" disabled={form.processing || loading || loadFailed}>
                        <Plus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Solicitar cirugía
                    </Btn>
                </div>
            </form>
        </ConfirmDialog>
    );
}
