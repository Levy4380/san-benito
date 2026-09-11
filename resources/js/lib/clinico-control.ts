import { cva } from 'class-variance-authority';

export const focusVisibleClass =
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus';

export const controlClass = cva(
    `box-border h-[var(--control-h)] min-h-[var(--control-h)] w-full rounded-md border border-rule bg-paper px-3 text-sm text-ink ${focusVisibleClass}`,
);
