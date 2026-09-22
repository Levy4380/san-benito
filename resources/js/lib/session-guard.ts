import { router } from '@inertiajs/react';
import type { SharedData } from '@/types';

const COOKIE = 'sb_uid';

function sessionUserId(): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
}

function renderedUserId(props: SharedData): string {
    const id = props.auth.user?.id;

    return id == null ? '0' : String(id);
}

export function installSessionGuard(): void {
    let renderedId = '0';
    let correcting = false;

    const sendHomeIfStale = (nextRenderedId: string) => {
        const liveId = sessionUserId();

        if (correcting || liveId === null || liveId === nextRenderedId) {
            return;
        }

        correcting = true;
        window.location.replace('/');
    };

    router.on('navigate', (event) => {
        renderedId = renderedUserId(event.detail.page.props as SharedData);
        sendHomeIfStale(renderedId);
    });

    router.on('invalid', (event) => {
        if (event.detail.response.status !== 403) {
            return;
        }

        event.preventDefault();
        window.location.replace('/');

        return false;
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            sendHomeIfStale(renderedId);
        }
    });
}
