import { router, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';
import Sidebar from '@/Components/Layout/Sidebar';
import Topbar from '@/Components/Layout/Topbar';
import ToastHost from '@/Components/Feedback/ToastHost';
import { isHomePage } from '@/lib/product-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Props = {
    children: ReactNode;
};

export default function AuthenticatedLayout({ children }: Props) {
    const page = usePage<SharedData>();
    const isHome = isHomePage(page.component);
    const { auth } = page.props;
    const [navOpen, setNavOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    useEffect(() => {
        const unNav = router.on('navigate', () => {
            setNavOpen(false);
            setUserOpen(false);
        });

        return () => {
            unNav();
            document.documentElement.classList.remove('route-loading');
        };
    }, []);

    if (!auth.user) {
        return (
            <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--app-radius)] bg-paper-2">
                <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-paper">
                    <main
                        data-app-main=""
                        className="flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto p-[var(--space-md)] min-[1200px]:p-[var(--space-lg)_var(--space-xl)]"
                    >
                        {children}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--app-radius)] bg-paper-2">
            <div
                className={cn(
                    'relative h-full min-h-0 w-full flex-1 bg-transparent',
                    'min-[1200px]:grid min-[1200px]:h-full min-[1200px]:min-h-0 min-[1200px]:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] min-[1200px]:grid-rows-[minmax(0,1fr)] min-[1200px]:overflow-hidden min-[1200px]:transition-[grid-template-columns] min-[1200px]:duration-[320ms] min-[1200px]:ease-out',
                    isHome && 'min-[1200px]:grid-cols-[0px_minmax(0,1fr)]',
                    'max-[1199px]:flex max-[1199px]:h-full max-[1199px]:min-h-0 max-[1199px]:flex-col max-[1199px]:overflow-hidden',
                )}
            >
                <Topbar
                    navOpen={navOpen}
                    userOpen={userOpen}
                    onToggleNav={() => {
                        setNavOpen((open) => !open);
                        setUserOpen(false);
                    }}
                    onToggleUser={() => {
                        setUserOpen((open) => !open);
                        setNavOpen(false);
                    }}
                />
                <Sidebar isHome={isHome} navOpen={navOpen} userOpen={userOpen} />
                <main
                    data-app-main=""
                    className={cn(
                        'm-[var(--app-frame)] flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-x-hidden overflow-y-auto rounded-[var(--app-radius)] bg-paper p-[var(--space-md)]',
                        'min-[1200px]:col-start-2 min-[1200px]:row-start-1 min-[1200px]:p-[var(--space-lg)_var(--space-xl)]',
                        'max-[1199px]:mt-[var(--space-2xs)] max-[1199px]:p-[var(--space-sm)_var(--space-xs)]',
                        'max-sm:p-[var(--space-2xs)_0.35rem]',
                        isHome && 'min-[1200px]:overflow-visible',
                    )}
                >
                    {children}
                </main>
            </div>
            <ToastHost />
            <div
                data-route-loader=""
                className="pointer-events-none fixed inset-x-0 top-0 z-[10000] opacity-0 transition-opacity duration-[120ms] ease-out"
                aria-hidden="true"
            >
                <div className="h-[3px] w-full overflow-hidden bg-[oklch(90%_0.02_255)]">
                    <div
                        data-route-loader-bar=""
                        className="h-full w-0 rounded-r-[2px] bg-[linear-gradient(90deg,var(--color-accent),oklch(62%_0.16_230))]"
                    />
                </div>
            </div>
        </div>
    );
}
