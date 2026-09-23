import { Link, usePage } from '@inertiajs/react';
import { focusVisibleClass } from '@/lib/clinico-control';
import { initials } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Props = {
    navOpen: boolean;
    userOpen: boolean;
    onToggleNav: () => void;
    onToggleUser: () => void;
};

export default function Topbar({ navOpen, userOpen, onToggleNav, onToggleUser }: Props) {
    const user = usePage<SharedData>().props.auth.user;

    if (!user) {
        return null;
    }

    return (
        <header
            className={cn(
                'relative z-[60] hidden shrink-0',
                'max-[1199px]:order-[-1] max-[1199px]:flex max-[1199px]:h-[var(--mobile-header-h)] max-[1199px]:min-h-[var(--mobile-header-h)] max-[1199px]:items-center max-[1199px]:justify-between max-[1199px]:gap-[0.35rem] max-[1199px]:rounded-[var(--app-radius)] max-[1199px]:bg-paper max-[1199px]:px-[var(--space-2xs)]',
            )}
        >
            <button
                type="button"
                className={cn(
                    'z-[2] grid size-[var(--control-h-sm)] shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-ink hover:bg-[oklch(22%_0.02_255/0.06)]',
                    focusVisibleClass,
                    navOpen && 'bg-[oklch(22%_0.02_255/0.08)]',
                )}
                aria-expanded={navOpen}
                aria-controls="sidebar-nav-panel"
                aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={onToggleNav}
            >
                <span className="relative block h-[1.5px] w-[0.85rem]" aria-hidden="true">
                    <span
                        className={cn(
                            'absolute left-0 block h-[1.5px] w-[0.85rem] rounded-[1px] bg-current transition-transform duration-short',
                            navOpen ? 'top-0 rotate-45' : 'top-[-3.5px]',
                        )}
                    />
                    <span className={cn('absolute top-0 left-0 block h-[1.5px] w-[0.85rem] rounded-[1px] bg-current', navOpen && 'bg-transparent')} />
                    <span
                        className={cn(
                            'absolute left-0 block h-[1.5px] w-[0.85rem] rounded-[1px] bg-current transition-transform duration-short',
                            navOpen ? 'top-0 -rotate-45' : 'top-[3.5px]',
                        )}
                    />
                </span>
            </button>
            <span className="min-w-0 flex-1 overflow-hidden text-center font-display text-[0.95rem] font-bold tracking-[-0.02em] text-ellipsis whitespace-nowrap text-ink max-md:text-[0.9rem]">
                <Link
                href="/"
                id="brand-home"
                aria-label="Ir al inicio"
                className="min-w-0 cursor-pointer flex-1 overflow-hidden text-center font-display text-[0.95rem] font-bold tracking-[-0.02em] text-ellipsis whitespace-nowrap text-ink max-md:text-[0.9rem]">
            
                San Benito
            </Link>
            </span>
            <button
                type="button"
                className={cn(
                    'z-[2] grid size-[var(--control-h-sm)] shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-ink hover:bg-[oklch(22%_0.02_255/0.06)]',
                    focusVisibleClass,
                    userOpen && 'bg-[oklch(22%_0.02_255/0.08)]',
                )}
                aria-expanded={userOpen}
                aria-controls="sidebar-user-panel"
                aria-label={userOpen ? 'Cerrar cuenta' : 'Abrir sesión'}
                onClick={onToggleUser}
            >
                <span
                    className="grid size-[1.35rem] place-items-center rounded-full bg-accent text-[0.62rem] font-semibold tracking-[0.02em] text-accent-ink"
                    aria-hidden="true"
                >
                    {initials(user.name)}
                </span>
            </button>
        </header>
    );
}
