export const COMPANY_REQUEST_CODE_PATTERN = /^EMP-\d{4}-\d{4,}$/;

export const COMPANY_CORRECTION_TOKEN_PATTERN = /^ccr1\.[A-Za-z0-9_-]{43}$/;

export const COMPANY_CORRECTION_FRAGMENT_KEY = "token";

export const COMPANY_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "En revisión",
  IN_REVIEW: "En revisión",
  OBSERVED: "Necesitamos una corrección",
  REJECTED: "Necesitamos otro documento",
  APPROVED: "Aprobada",
};

export const COMPANY_LOOKUP_ERROR_MESSAGE =
  "No se pudo consultar la solicitud. Revisa el correo e inténtalo de nuevo.";

export const COMPANY_RATE_LIMIT_MESSAGE =
  "Realizaste demasiados intentos. Espera unos minutos antes de volver a intentarlo.";

export const COMPANY_CORRECTION_AUTHORIZATION_MESSAGE =
  "El enlace de corrección venció o ya se usó. Abre el enlace más reciente de tu correo.";

export const COMPANY_CORRECTION_RETRY_MESSAGE =
  "No se pudo reenviar el documento. Inténtalo de nuevo.";

export const COMPANY_CORRECTION_MISSING_FILE_MESSAGE =
  "Selecciona un documento antes de enviarlo.";

export const COMPANY_CORRECTION_SUCCESS_MESSAGE =
  "Tu documento fue enviado, volverá a revisión.";

export const COMPANY_CORRECTION_MISSING_TOKEN_MESSAGE =
  "Para corregir el documento, abre el enlace de tu correo de revisión.";

export const COMPANY_UNAUTHORIZED_CODE = "COMPANY_DOCUMENT_CORRECTION_UNAUTHORIZED";

export const COMPANY_RATE_LIMIT_CODE = "COMPANY_REQUEST_RATE_LIMIT";
