import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-x-clip bg-[var(--color-paper)] p-6 md:p-10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 50% at 10% 0%, oklch(90% 0.04 130 / 0.7), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, oklch(92% 0.03 95 / 0.8), transparent 50%)',
                }}
            />
            <div className="relative w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-5">
                        <Link href={route('home')} className="flex flex-col items-center gap-3 font-medium">
                            <div className="flex size-11 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]">
                                <AppLogoIcon className="size-6 fill-current" />
                            </div>
                            <span className="font-display text-[length:var(--text-xl)] tracking-tight text-[var(--color-ink)]">
                                San Benito
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="font-display text-[length:var(--text-xl)] text-[var(--color-ink)]">{title}</h1>
                            <p className="text-center text-[length:var(--text-sm)] text-[var(--color-ink-2)]">{description}</p>
                        </div>
                    </div>
                    <div className="surface">{children}</div>
                </div>
            </div>
        </div>
    );
}
