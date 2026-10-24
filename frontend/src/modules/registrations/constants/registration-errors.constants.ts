import type { RegistrationErrorCode } from "../types/registration-error-code.types";

export const REGISTRATION_ERROR_MESSAGES = {
  VALIDATION_ERROR: "Revisa los datos e inténtalo nuevamente.",
  UNAUTHENTICATED: "Inicia sesión para continuar.",
  USER_INACTIVE: "Tu cuenta está inactiva. Contacta con administración.",
  REGISTRATION_NOT_OWNED: "No puedes cancelar una inscripción de otra persona.",
  EVENT_NOT_FOUND: "No encontramos el evento solicitado.",
  REGISTRATION_NOT_FOUND: "No encontramos tu inscripción para este evento.",
  ALREADY_REGISTERED: "Ya estás inscrito en este evento.",
  EVENT_FULL: "Ya no quedan cupos disponibles.",
  REGISTRATION_ALREADY_CANCELLED: "Tu inscripción ya estaba cancelada.",
  EVENT_NOT_OPEN: "Este evento no está habilitado para inscripciones.",
  REGISTRATION_CLOSED: "El plazo de inscripción y cancelación ha terminado.",
  INTERNAL_ERROR: "No pudimos completar la operación. Inténtalo más tarde.",
} satisfies Record<RegistrationErrorCode, string>;

export const DEFAULT_REGISTRATION_ERROR_MESSAGE = "No pudimos completar la operación. Inténtalo más tarde.";
