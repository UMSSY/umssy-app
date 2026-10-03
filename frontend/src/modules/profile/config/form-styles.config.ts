const FORM_CONTROL_BASE_CLASS =
  "w-full rounded-lg border border-border bg-surface px-4 text-[15px] text-ink placeholder:text-text-secondary/70 focus:border-ink-soft focus:ring-2 focus:ring-ink/10 focus:outline-none disabled:opacity-60 aria-invalid:border-accent aria-invalid:focus:ring-accent/15";

export const FIELD_ERROR_CLASS = "text-[13px] text-danger";

export const INPUT_CLASS = `${FORM_CONTROL_BASE_CLASS} h-12`;

export const TEXTAREA_CLASS = `${FORM_CONTROL_BASE_CLASS} resize-y py-3`;

export const PRIMARY_BUTTON_CLASS =
  "h-12 bg-accent px-6 text-[14px] font-semibold text-white hover:bg-danger";

export const SECONDARY_BUTTON_CLASS =
  "h-12 border-border-strong bg-surface px-6 text-[14px] font-semibold text-ink hover:bg-surface-soft";

export const DANGER_OUTLINE_BUTTON_CLASS =
  "h-12 border-accent bg-surface px-6 text-[14px] font-semibold text-accent hover:bg-interaction hover:text-accent";
