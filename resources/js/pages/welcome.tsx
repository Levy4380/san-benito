import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const entered = Boolean(auth.user);

    return (
        <>
            <Head title="San Benito">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=inter-tight:400,500,600,700|ibm-plex-sans:400,500,600|ibm-plex-mono:400,500" rel="stylesheet" />
            </Head>

            <div className="relative min-h-screen overflow-x-clip bg-[var(--color-paper)] text-[var(--color-ink)]">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 40% at 0% 0%, oklch(96% 0.02 255 / 0.7), transparent 55%), radial-gradient(ellipse 45% 35% at 100% 10%, oklch(97% 0.015 255 / 0.5), transparent 50%)',
                    }}
                />

                <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-6 md:px-10">
                    <Link href="/" className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]">
                            <AppLogoIcon className="size-4 fill-current" />
                        </span>
                        <span className="font-display truncate text-[length:var(--text-lg)] tracking-tight">San Benito</span>
                    </Link>
                    <nav className="flex shrink-0 items-center gap-2 text-[length:var(--text-sm)]">
                        {entered ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-[var(--radius-input)] bg-[var(--color-accent)] px-4 py-2 whitespace-nowrap text-[var(--color-accent-ink)] transition-[transform,opacity] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:opacity-90 active:translate-y-px"
                            >
                                Ir a la agenda
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-[var(--radius-input)] px-3 py-2 whitespace-nowrap text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-[var(--radius-input)] bg-[var(--color-accent)] px-4 py-2 whitespace-nowrap text-[var(--color-accent-ink)] transition-[transform,opacity] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:opacity-90 active:translate-y-px"
                                >
                                    Registrarme
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="relative mx-auto w-full max-w-3xl px-6 pb-20 pt-10 md:px-10 md:pt-16">
                    <p className="font-display text-[length:var(--text-lg)] text-[var(--color-accent)]">Hola,</p>
                    <h1 className="font-display mt-3 max-w-[18ch] text-[length:var(--text-display)] leading-[1.08] text-[var(--color-ink)]">
                        Tu agenda del sanatorio, en un solo lugar.
                    </h1>
                    <p className="mt-6 max-w-[42ch] text-[length:var(--text-md)] leading-relaxed text-[var(--color-ink-2)]">
                        Pacientes reservan. Doctores publican horarios. Administración ve el día completo. Sin ruido: abrís y mirás
                        la agenda.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        {entered ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center rounded-[var(--radius-input)] bg-[var(--color-accent)] px-5 py-2.5 text-[length:var(--text-sm)] font-semibold whitespace-nowrap text-[var(--color-accent-ink)] transition-[transform,opacity] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:opacity-90 active:translate-y-px"
                            >
                                Ver mi agenda
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center rounded-[var(--radius-input)] bg-[var(--color-accent)] px-5 py-2.5 text-[length:var(--text-sm)] font-semibold whitespace-nowrap text-[var(--color-accent-ink)] transition-[transform,opacity] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:opacity-90 active:translate-y-px"
                                >
                                    Entrar a la agenda
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center rounded-[var(--radius-input)] border border-[var(--color-rule)] bg-transparent px-5 py-2.5 text-[length:var(--text-sm)] font-semibold whitespace-nowrap text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-2)]"
                                >
                                    Soy paciente nuevo
                                </Link>
                            </>
                        )}
                    </div>

                    <ul className="mt-16 max-w-xl divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                        {[
                            { title: 'Pacientes', body: 'Buscá por doctor y elegí un horario libre.' },
                            { title: 'Doctores', body: 'Publicá slots y mirá quién viene ese día.' },
                            { title: 'Administración', body: 'Filtrá turnos de toda la institución.' },
                        ].map((item) => (
                            <li key={item.title} className="grid gap-1 py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
                                <span className="font-display text-[length:var(--text-lg)] text-[var(--color-ink)]">{item.title}</span>
                                <span className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">{item.body}</span>
                            </li>
                        ))}
                    </ul>
                </main>

                <footer className="relative mx-auto w-full max-w-3xl px-6 pb-10 md:px-10">
                    <p className="text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
                        Con cuidado,
                        <br />
                        <span className="font-display text-[var(--color-ink)]">San Benito</span>
                    </p>
                </footer>
            </div>
        </>
    );
}
