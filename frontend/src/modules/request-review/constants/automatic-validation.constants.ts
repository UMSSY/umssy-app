import type { FieldResult, TimelineActorRole, ValidationField, ValidationResult } from "../types/automatic-validation.types";

export const AUTO_APPROVAL_THRESHOLD = 90;
export const LOW_MATCH_THRESHOLD = 50;

export const ALL_VALIDATIONS_VALUE = "all";
export const VALIDATION_FILTER_OPTIONS: ReadonlyArray<{ value: ValidationResult | typeof ALL_VALIDATIONS_VALUE; label: string }> = [
  { value: ALL_VALIDATIONS_VALUE, label: "Todas" },
  { value: "auto_approved", label: "Aprobadas automáticamente" },
  { value: "auto_rejected", label: "Rechazadas automáticamente" },
  { value: "manual_review", label: "Revisión manual" },
  { value: "queued", label: "En cola de lectura OCR" },
];

export const AUTOMATION_LABELS = {
  queued: "Pendiente",
  auto_approved: "Aprobada automáticamente",
  auto_rejected: "Rechazada automáticamente",
  manual_review: "Revisión manual",
} as const;

export const QUEUED_DESCRIPTION = "En cola de lectura OCR";
export const NOT_VALIDATED_LABEL = "Sin validar";

export const VALIDATION_FIELD_LABELS: Record<ValidationField, string> = {
  fullName: "Nombre completo",
  career: "Carrera",
  graduationYear: "Año de titulación",
  idCardNumber: "Carnet de identidad",
  sisCode: "Código SIS",
};

export const FIELD_RESULT_LABELS: Record<FieldResult, string> = {
  match: "Coincide",
  mismatch: "No coincide",
  not_compared: "No se compara",
};

export const TIMELINE_ACTION_LABELS: Record<string, string> = {
  submitted: "Solicitud enviada",
  ocr_read: "Lectura OCR",
  approved: "Decisión tomada: aprobada",
  rejected: "Decisión tomada: rechazada",
  sent_to_manual_review: "Decisión tomada: revisión manual",
  opened: "Abierta para revisión",
  activation_code_sent: "Código enviado",
  approval_reverted: "Aprobación revertida",
  account_activated: "Cuenta activada",
  document_replaced: "Documento reemplazado",
};

export const TIMELINE_ACTOR_LABELS: Record<TimelineActorRole, string> = {
  titulado: "Solicitante",
  sistema: "Sistema",
  administrativo: "Administrativo",
};

export const REVERT_SUCCESS_MESSAGE = "La aprobación se revirtió. La solicitud volvió a revisión manual.";
