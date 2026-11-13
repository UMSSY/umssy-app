import { OTHER_REJECTION_REASON } from "@/modules/request-review";
import type { RejectionReason } from "../types/rejection-reason.types";

export const USERS_TABLE_HEAD_CLASSES = "h-10 px-4 py-2 text-xs font-semibold text-ink";

export const TABLE_CELL_CLASSES = "px-4 py-3 text-sm text-ink-soft";
export const TABLE_CONTAINER_CLASSES = "@container overflow-hidden rounded-lg border border-border bg-surface";

export const REJECTION_REASON_SHORT_LABELS: Record<RejectionReason, string> = {
  "Documento ilegible": "Documento ilegible",
  "El nombre no coincide con los datos declarados": "El nombre no coincide",
  "Documento incompleto o recortado": "Documento incompleto",
  "El documento no corresponde a la carrera": "No corresponde a la carrera",
  [OTHER_REJECTION_REASON]: OTHER_REJECTION_REASON,
};
