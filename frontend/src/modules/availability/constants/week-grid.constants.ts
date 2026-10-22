import type { AvailabilityBlockState } from "../types/availability-block-state.types";

export const WEEK_GRID_START_HOUR = 7;
export const WEEK_GRID_END_HOUR = 22;
export const HOUR_HEIGHT_PX = 48;
export const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] as const;

export const STATE_BUTTON_VARIANT: Record<AvailabilityBlockState, "outline" | "default"> = {
  free: "outline",
  pending: "outline",
  confirmed: "outline",
};

export const STATE_BUTTON_CLASSES: Record<AvailabilityBlockState, string> = {
  free: "border-availability-border bg-availability text-availability-foreground hover:bg-availability-border/30 hover:text-availability-foreground disabled:opacity-100",
  pending: "border-notice-border border-dashed bg-notice text-notice-foreground hover:bg-notice hover:text-notice-foreground disabled:opacity-100",
  confirmed: "border-accent bg-accent text-primary-foreground hover:bg-accent hover:text-primary-foreground disabled:opacity-100",
};

export const STATE_LABELS_ES: Record<AvailabilityBlockState, string> = {
  free: "libre",
  pending: "pendiente",
  confirmed: "confirmada",
};

export const SELECTED_BLOCK_CLASSES = "border-accent bg-accent text-primary-foreground ring-2 ring-accent ring-offset-2 hover:bg-accent hover:text-primary-foreground";

export const SELECTED_LEGEND_LABEL = "Tu selección";

export const BLOCK_STATE_TEXT: Record<AvailabilityBlockState, string> = {
  free: "Libre",
  pending: "Pendiente",
  confirmed: "Confirmada",
};

export const WEEK_GRID_LEGEND = {
  free: "Libre",
  pending: "Solicitud pendiente",
  confirmed: "Cita confirmada",
  freeSlot: "Horario libre",
} as const;

export const EMPTY_DAY_LABEL = "Sin bloques";
