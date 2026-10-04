import type { DocumentType, RequestStatus } from "../types/request-review.types";

export const REQUESTS_PAGE_SIZE = 10;

export const REQUEST_STATUS_TABS: { status: RequestStatus; label: string }[] = [
  { status: "PENDING", label: "Pendientes" },
  { status: "IN_REVIEW", label: "En revisión" },
  { status: "APPROVED", label: "Aprobadas" },
  { status: "REJECTED", label: "Rechazadas" },
];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ACADEMIC_DIPLOMA: "Diploma académico",
  NATIONAL_TITLE: "Título en provisión nacional",
};