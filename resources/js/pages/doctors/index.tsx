import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type Specialty = {
    id: number;
    name: string;
};

type Doctor = {
    id: number;
    license_number: string;
    user: { name: string; email: string };
    specialty: { name: string };
};

type Props = {
    doctors: Doctor[];
    specialties: Specialty[];
    filters: {
        name?: string | null;
        specialty_id?: number | null;
    };
};

export default function DoctorsIndex({ doctors, specialties, filters }: Props) {
    const [specialtyId, setSpecialtyId] = useState(
        filters.specialty_id != null ? String(filters.specialty_id) : '',
    );
    const [name, setName] = useState(filters.name ?? '');

    const hasActiveFilter = specialtyId !== '' || name.trim() !== '';

    const applyFilters = (nextSpecialtyId: string, nextName: string) => {
        router.get(
            route('doctors.index'),
            {
                specialty_id: nextSpecialtyId || undefined,
                name: nextName.trim() || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const onSpecialtyChange = (value: string) => {
        setSpecialtyId(value);
        applyFilters(value, name);
    };

    const search = (e: FormEvent) => {
        e.preventDefault();
        applyFilters(specialtyId, name);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Doctores', href: '/doctors' }]}>
            <Head title="Buscar doctores" />
            <div className="page-shell page-shell--wide">
                <PageHeader
                    title="Doctores"
                    description="Filtrá por especialidad, buscá por nombre, o combiná ambos."
                />

                <form onSubmit={search} className="surface grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="specialty_id">Especialidad</Label>
                        <select
                            id="specialty_id"
                            className="border-input bg-background h-10 rounded-[var(--radius-input)] border px-3 text-sm"
                            value={specialtyId}
                            onChange={(e) => onSpecialtyChange(e.target.value)}
                        >
                            <option value="">Todas / sin filtrar</option>
                            {specialties.map((specialty) => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="grid min-w-0 flex-1 gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Ana Pérez"
                            />
                        </div>
                        <Button type="submit" className="whitespace-nowrap">
                            Buscar
                        </Button>
                    </div>
                </form>

                {!hasActiveFilter ? (
                    <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                        Elegí una especialidad o buscá por nombre para ver doctores.
                    </p>
                ) : (
                    <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                        {doctors.map((doctor) => (
                            <li
                                key={doctor.id}
                                className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-display text-[length:var(--text-lg)]">{doctor.user.name}</p>
                                    <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                        {doctor.specialty.name} · Matrícula {doctor.license_number}
                                    </p>
                                </div>
                                <Button asChild variant="outline" className="shrink-0 whitespace-nowrap">
                                    <a href={route('doctors.slots', doctor.id)}>Ver turnos</a>
                                </Button>
                            </li>
                        ))}
                        {doctors.length === 0 && (
                            <li className="py-8 text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                                No se encontraron doctores con esos filtros.
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
