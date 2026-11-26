import { FILE_VALIDATION_MESSAGES } from "@/modules/profile";

export const CV_ERROR_MESSAGES = {
  load: "No se pudo cargar tu CV. Intenta de nuevo más tarde.",
  history: "No se pudo cargar el historial de CVs. Intenta de nuevo más tarde.",
  open: "No se pudo abrir el CV. Intenta de nuevo.",
  download: "No se pudo descargar el CV. Intenta de nuevo.",
  upload: "No se pudo subir tu CV. Intenta de nuevo.",
  delete: "No se pudo eliminar tu CV. Intenta de nuevo.",
  generate: "No se pudo generar tu CV. Intenta de nuevo.",
  extract: "No se pudieron leer los datos de tu CV.",
};

export const CV_ERROR_MESSAGES_BY_STATUS: Record<number, string> = {
  400: FILE_VALIDATION_MESSAGES.emptyFile,
  401: "Tu sesión no es válida. Inicia sesión nuevamente.",
  404: "No encontramos tu CV. Recarga la página.",
  413: FILE_VALIDATION_MESSAGES.fileTooLarge,
  415: FILE_VALIDATION_MESSAGES.invalidCvType,
};

export const CV_FILE_REJECTION_STATUSES: readonly number[] = [400, 413, 415];

export const CV_EXTRACTION_ERROR_MESSAGES = {
  network: "No pudimos conectarnos con el servidor. Revisa tu conexión e intenta de nuevo.",
  server: "El servidor no pudo leer tu CV en este momento. Intenta de nuevo en unos segundos.",
  session: "Tu sesión no es válida. Inicia sesión nuevamente.",
  unknown: CV_ERROR_MESSAGES.extract,
} as const;

export const CV_EXTRACTION_ERROR_MESSAGES_BY_CODE: Readonly<Record<string, string>> = {
  CV_UNREADABLE:
    "Tu PDF no tiene texto seleccionable (puede ser un escaneo o una imagen), así que no podemos leer sus datos. Sube un PDF exportado desde tu editor o llena tu perfil a mano.",
  CV_EXTRACTION_FAILED: "No pudimos procesar el contenido de tu PDF. Intenta de nuevo en unos segundos.",
  CV_NOT_FOUND: "No encontramos este CV. Puede que se haya eliminado; recarga la página.",
};

export const CV_EXTRACTION_NOT_FOUND_CODE = "CV_NOT_FOUND";

export const CV_EXTRACTION_RETRYABLE_CODES: readonly string[] = ["CV_EXTRACTION_FAILED"];

export const CV_EXTRACTION_RETRYABLE_STATUSES: readonly number[] = [408, 429];

export const CV_UNAUTHORIZED_STATUS = 401;

export const CV_NOT_FOUND_STATUS = 404;

export const CV_SERVER_ERROR_MIN_STATUS = 500;
