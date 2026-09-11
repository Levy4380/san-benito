/* prettier-ignore */
import {
createInertiaApp
} from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import AuthenticatedLayout from './Layouts/AuthenticatedLayout';
import { isProductPage } from './lib/product-layout';

function productLayout(page) {
    return <AuthenticatedLayout>{page}</AuthenticatedLayout>;
}

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const pages = import.meta.glob('./Pages/**/*.tsx', {
                eager: true,
            });
            const resolved = pages[`./Pages/${name}.tsx`];
            if (resolved && isProductPage(name)) {
                resolved.default.layout = productLayout;
            }
            return resolved;
        },
        // prettier-ignore
        setup: ({ App, props }) => <App {...props} />,
    }),
);
