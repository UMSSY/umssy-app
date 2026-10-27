export const PROPOSAL_SUPPORT_ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Debes iniciar sesión para apoyar una propuesta.',
  AUTH_REQUIRED: 'Debes iniciar sesión para apoyar una propuesta.',
  FORBIDDEN_ROLE: 'Solo los usuarios con perfil Titulado pueden apoyar propuestas.',
  USER_INACTIVE: 'Tu cuenta está inactiva. Contacta con administración.',
  ALREADY_SUPPORTED: 'Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.',
  PROPOSAL_EXPIRED: 'La propuesta ya venció.',
  EVENT_NOT_SUPPORTABLE: 'La propuesta ya no acepta apoyos. Actualiza su estado.',
  EVENT_NOT_FOUND: 'No encontramos la propuesta solicitada.',
  VALIDATION_ERROR: 'La propuesta seleccionada no es válida. Actualiza el listado.',
  INTERNAL_ERROR: 'No pudimos registrar tu apoyo. Inténtalo nuevamente.',
} as const;

export const DEFAULT_PROPOSAL_SUPPORT_ERROR_MESSAGE =
  'No pudimos registrar tu apoyo. Revisa la conexión e inténtalo nuevamente.';
