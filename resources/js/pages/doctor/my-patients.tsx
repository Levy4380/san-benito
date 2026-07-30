import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type PatientRow = {
    id: number;
    dni: string;
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
};

type Props = {
    patients: PatientRow[];
    candidates: PatientRow[];
    filters: {
        q?: string | null;
        link_q?: string | null;
    };
};

export default function MyPatients({ patients, candidates, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [linkQ, setLinkQ] = useState(filters.link_q ?? '');
    const linkForm = useForm({ patient_id: '' });

    const searchList = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('my-patients.index'),
            {
                q: q.trim() || undefined,
                link_q: linkQ.trim() || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const searchCandidates = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('my-patients.index'),
            {
                q: q.trim() || undefined,
                link_q: linkQ.trim() || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const linkPatient = (e: FormEvent) => {
        e.preventDefault();
        linkForm.post(route('my-patients.store'), {
            onSuccess: () => linkForm.reset('patient_id'),
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Mis pacientes', href: '/my-patients' }]}>
            <Head title="Mis pacientes" />
            <div className="page-shell page-shell--wide">
                <PageHeader
                    title="Mis pacientes"
                    description="Pacientes vinculados a tu práctica. El vínculo se crea al reservar o al dar de alta manualmente."
                />

                <section className="surface">
                    <h2 className="font-display text-[length:var(--text-lg)]">Vincular paciente</h2>
                    <form onSubmit={searchCandidates} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link_q">Buscar por DNI o nombre</Label>
                            <Input
                                id="link_q"
                                value={linkQ}
                                onChange={(e) => setLinkQ(e.target.value)}
                                placeholder="Mínimo 2 caracteres"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Buscar
                        </Button>
                    </form>

                    {candidates.length > 0 && (
                        <form onSubmit={linkPatient} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="patient_id">Paciente</Label>
                                <select
                                    id="patient_id"
                                    className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                                    value={linkForm.data.patient_id}
                                    onChange={(e) => linkForm.setData('patient_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    {candidates.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.user.name} · DNI {patient.dni}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={linkForm.errors.patient_id} />
                            </div>
                            <Button type="submit" disabled={linkForm.processing}>
                                Vincular
                            </Button>
                        </form>
                    )}

                    {filters.link_q && candidates.length === 0 && (
                        <p className="mt-4 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                            No hay pacientes que coincidan con esa búsqueda.
                        </p>
                    )}
                </section>

                <section className="surface">
                    <form onSubmit={searchList} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="q">Filtrar mis pacientes</Label>
                            <Input
                                id="q"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="DNI o nombre"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Filtrar
                        </Button>
                    </form>
                </section>

                <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                    {patients.map((patient) => (
                        <li key={patient.id} className="py-4">
                            <p className="font-display text-[length:var(--text-md)]">{patient.user.name}</p>
                            <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                DNI {patient.dni}
                                {patient.user.phone ? ` · ${patient.user.phone}` : ''}
                                {' · '}
                                {patient.user.email}
                            </p>
                        </li>
                    ))}
                    {patients.length === 0 && (
                        <li className="py-8 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                            Todavía no tenés pacientes vinculados.
                        </li>
                    )}
                </ul>
            </div>
        </AppLayout>
    );
}
