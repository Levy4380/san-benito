/**
 * Shared mobile chrome / phone density classes.
 * Breakpoints (design.md): chrome <1200; agenda sheet ≤767; filters 640.
 * Do not invent parallel tokens — use tokens.css + these class fragments.
 */

/** Bottom sheet snap points — keep in sync with Panel.tsx + design.md Calendar */
export const SHEET_COLLAPSED_PCT = 13;
export const SHEET_EXPANDED_PCT = 72;
export const SHEET_SNAP_PCT = 40;

/** Phone surface radius (≤767): card + 2px, not a third radius token */
export const phoneSurfaceRadiusClass = 'max-md:rounded-[calc(var(--radius-card)+2px)]';

/** Shared list / card padding on phone */
export const phoneInteractivePadClass = 'max-md:px-[0.9rem] max-md:py-[0.85rem]';

/** Result / booking list gap on phone */
export const phoneListGapClass = 'max-md:gap-[0.75rem]';

/**
 * Stage clearance above the collapsed bottom sheet (phone only).
 * Matches SHEET_COLLAPSED_PCT so the calendar is not covered when the sheet is docked.
 */
export const phoneAgendaSheetClearanceClass = 'max-md:pb-[calc(13%+0.85rem)]';

/** Main column padding under the mobile topbar (<1200). Keep horizontal gutter so titles are not flush. */
export const chromeMainPadClass =
    'max-[1199px]:mt-[var(--space-2xs)] max-[1199px]:p-[var(--space-sm)] max-md:px-[var(--space-sm)] max-md:py-[var(--space-xs)]';

/**
 * Toast stack: desktop stays near the top; <1200 clears the fixed topbar + safe-area.
 */
export const toastHostClass =
    'pointer-events-none fixed top-[0.75rem] right-[0.75rem] z-[120] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col items-end gap-[0.45rem] max-[1199px]:top-[calc(var(--app-frame)+var(--mobile-header-h)+var(--space-2xs)+env(safe-area-inset-top,0px))] max-[1199px]:right-[0.45rem] max-[1199px]:w-[min(20rem,calc(100vw-0.9rem))]';
