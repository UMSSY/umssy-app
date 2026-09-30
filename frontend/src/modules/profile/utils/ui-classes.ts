export const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-danger disabled:cursor-not-allowed disabled:opacity-60";

export const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-lg border border-border-strong bg-surface px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60";

export const TEXT_BUTTON_CLASS =
  "text-[12.5px] font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60";

// Mobile: buttons fill the row (secondary 1/3, primary 2/3). Desktop: natural width.
export const FORM_ACTIONS_CLASS = "flex w-full gap-3 sm:w-auto";
export const MOBILE_SECONDARY_ACTION_CLASS = "flex-1 sm:flex-none";
export const MOBILE_PRIMARY_ACTION_CLASS = "flex-[2] sm:flex-none";

export function getInputClass(hasError: boolean): string {
  const base =
    "w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-text-secondary/70 focus:outline-none focus:ring-2";

  return hasError
    ? `${base} border-accent focus:ring-accent/30`
    : `${base} border-border focus:border-ink-soft focus:ring-ink/10`;
}
