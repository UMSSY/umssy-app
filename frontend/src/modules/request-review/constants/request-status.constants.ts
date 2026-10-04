import type { RequestStatus } from "../types/request-review-types";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};
