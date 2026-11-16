export const CV_EXPORT_FILE_PREFIX = "CV";

export const CV_EXPORT_FILE_EXTENSION = ".pdf";

export const CV_EXPORT_ERROR_MESSAGES_BY_STATUS: Record<number, string> = {
  401: "Tu sesión no es válida. Inicia sesión nuevamente.",
  403: "Tu cuenta no tiene permiso para generar un CV.",
  404: "No encontramos tu perfil. Completa tus datos e intenta de nuevo.",
};
