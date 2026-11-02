export const CORRECTION_TOKEN_FRAGMENT_KEY = "correctionToken";
export const DOCUMENT_CORRECTION_TOKEN_PATTERN = /^dcr1\.[A-Za-z0-9_-]{43}$/;

export const CORRECTION_AUTHORIZATION_MESSAGE =
  "No se pudo autorizar la corrección. Abre el enlace de tu correo de revisión.";
export const CORRECTION_CONFLICT_MESSAGE =
  "La solicitud cambió o no admite este reenvío. Vuelve a verificar su estado desde el enlace de tu correo.";
export const CORRECTION_FILE_ERROR_MESSAGE =
  "No se pudo aceptar el archivo. Revisa su formato, tamaño y tipo de documento.";
export const CORRECTION_RETRY_MESSAGE =
  "No se pudo reenviar el documento. Inténtalo de nuevo.";
export const CORRECTION_MISSING_FILE_MESSAGE = "Selecciona un documento antes de enviarlo.";
export const CORRECTION_MISSING_TYPE_MESSAGE = "Elige el tipo de documento.";
