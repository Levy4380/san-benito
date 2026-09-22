import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import AuthenticatedLayout from './Layouts/AuthenticatedLayout';
import { isProductPage } from './lib/product-layout';
import { installSessionGuard } from './lib/session-guard';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'San Benito';

function productLayout(page: ReactNode) {
    return <AuthenticatedLayout>{page}</AuthenticatedLayout>;
}

router.on('start', () => document.documentElement.classList.add('route-loading'));
router.on('finish', () => document.documentElement.classList.remove('route-loading'));
installSessionGuard();

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')).then((module) => {
            const page = module as { default: { layout?: (page: ReactNode) => ReactNode } };
            if (isProductPage(name)) {
                page.default.layout = productLayout;
            }

            return module;
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        delay: 0,
        color: 'oklch(47% 0.16 255)',
        includeCSS: true,
        showSpinner: false,
    },
});
