import type { AvailabilityBlockState } from "../types/availability-block-state.types";
import type { WeekGridDensity } from "../types/week-grid-density.types";

export const HOUR_HEIGHT_PX = 72;

export const COMPACT_HOUR_HEIGHT_PX = 44;

export const HOUR_HEIGHT_PX_BY_DENSITY: Record<WeekGridDensity, number> = {
  normal: HOUR_HEIGHT_PX,
  compact: COMPACT_HOUR_HEIGHT_PX,
};

export const WEEK_GRID_DENSITY_STORAGE_KEY = "umssy-week-grid-density";

export const WEEK_GRID_DENSITY_TEXT = {
  label: "Densidad de la grilla",
  normal: "Normal",
  compact: "Compacta",
} as const;

export const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] as const;

export const STATE_BUTTON_VARIANT: Record<AvailabilityBlockState, "outline" | "default"> = {
  free: "outline",
  confirmed: "outline",
};

export const STATE_BUTTON_CLASSES: Record<AvailabilityBlockState, string> = {
  free: "border-availability-border bg-availability text-availability-foreground hover:bg-availability-border/30 hover:text-availability-foreground disabled:opacity-100",
  confirmed: "border-accent bg-accent text-primary-foreground hover:bg-accent hover:text-primary-foreground disabled:opacity-100",
};

export const STATE_LABELS_ES: Record<AvailabilityBlockState, string> = {
  free: "libre",
  confirmed: "confirmada",
};

export const SELECTED_BLOCK_CLASSES = "border-accent bg-accent text-primary-foreground ring-2 ring-accent ring-offset-2 hover:bg-accent hover:text-primary-foreground";

export const BLOCK_STATE_TEXT: Record<AvailabilityBlockState, string> = {
  free: "Libre",
  confirmed: "Cita",
};

export const WEEK_GRID_LEGEND = {
  free: "Libre",
  confirmed: "Cita confirmada",
  freeSlot: "Horario libre",
} as const;
