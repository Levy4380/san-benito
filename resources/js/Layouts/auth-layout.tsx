import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import Hint from '@/Components/Surfaces/Hint';
import ToastHost from '@/Components/Feedback/ToastHost';

type Props = {
    children: ReactNode;
    title: string;
    description?: string;
};

export default function AuthClinicoLayout({ children, title, description }: Props) {
    return (
        <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--app-radius)] bg-paper-2">
            <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,oklch(96%_0.03_255),transparent),var(--color-paper)]">
                <main
                    data-app-main=""
                    className="flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto p-[var(--space-md)] min-[1200px]:p-[var(--space-lg)_var(--space-xl)]"
                >
                    <section className="flex h-full min-h-0 w-full flex-1 flex-col justify-center">
                        <div className="mx-auto grid w-[min(100%,26rem)] gap-[var(--space-sm)] rounded-lg border border-rule bg-paper p-[var(--space-lg)] [&_form]:grid [&_form]:gap-[var(--space-sm)]">
                            <Link
                                href="/login"
                                className="flex flex-col items-center gap-[var(--space-sm)] text-center no-underline"
                                aria-label="San Benito"
                            >
                                <img
                                    src="/images/san-benito-logo.png"
                                    width={112}
                                    height={112}
                                    alt=""
                                    className="block size-28 shrink-0 rounded-full bg-white object-contain shadow-[0_2px_10px_oklch(22%_0.02_255/0.12)]"
                                />
                                <span className="flex max-w-[11.5rem] flex-col gap-[0.1rem] leading-[1.12]">
                                    <span className="text-[0.8rem] font-medium tracking-[0.01em] text-ink-2">Sanatorio integral</span>
                                    <span className="text-[1.2rem] font-bold tracking-[-0.03em] text-ink max-md:text-[1.05rem]">San Benito</span>
                                </span>
                            </Link>
                            <h1 className="text-center text-[length:var(--text-xl)] max-md:text-[1.35rem]">{title}</h1>
                            {description ? <Hint>{description}</Hint> : null}
                            <div className="contents">{children}</div>
                        </div>
                    </section>
                </main>
            </div>
            <ToastHost />
        </div>
    );
}
