import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="font-display truncate leading-none tracking-tight text-[length:var(--text-lg)] text-[var(--color-ink)]">
                    San Benito
                </span>
            </div>
        </>
    );
}
