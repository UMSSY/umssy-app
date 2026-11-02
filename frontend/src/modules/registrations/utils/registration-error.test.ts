import { describe, expect, it } from "vitest";
import { getRegistrationErrorMessage } from "./registration-error";
import { REGISTRATION_ERROR_MESSAGES, DEFAULT_REGISTRATION_ERROR_MESSAGE } from "../constants/registration-errors.constants";

const ERROR_CASES = [
  ["VALIDATION_ERROR", 400, "Revisa los datos e inténtalo nuevamente."],
  ["UNAUTHENTICATED", 401, "Inicia sesión para continuar."],
  ["AUTH_REQUIRED", 401, "Debes iniciar sesión para continuar."],
  ["USER_INACTIVE", 403, "Tu cuenta está inactiva. Contacta con administración."],
  ["REGISTRATION_NOT_OWNED", 403, "No puedes cancelar una inscripción de otra persona."],
  ["REGISTRATION_FORBIDDEN", 403, "No tienes permiso para modificar esta inscripción."],
  ["EVENT_NOT_FOUND", 404, "No encontramos el evento solicitado."],
  ["REGISTRATION_NOT_FOUND", 404, "No encontramos tu inscripción para este evento."],
  ["ALREADY_REGISTERED", 409, "Ya estás inscrito en este evento."],
  ["EVENT_FINISHED", 422, "El taller ya finalizó"],
  ["EVENT_FULL", 409, "Ya no quedan cupos disponibles."],
  ["REGISTRATION_ALREADY_CANCELLED", 409, "Tu inscripción ya estaba cancelada."],
  ["EVENT_NOT_OPEN", 422, "Este evento no está habilitado para inscripciones."],
  ["EVENT_CANCELLED", 422, "Este evento ha sido cancelado y no admite inscripciones."],
  ["REGISTRATION_CLOSED", 422, "El plazo de inscripción y cancelación ha terminado."],
  ["CANCELLATION_NOT_ALLOWED", 422, "No es posible cancelar la inscripción una vez iniciado el evento."],
  ["INTERNAL_ERROR", 500, "No pudimos completar la operación. Inténtalo más tarde."],
] as const;

describe("registration error catalog", () => {
  it.each(ERROR_CASES)("translates %s to its Spanish user message", (code, statusCode, message) => {
    const error = {
      isAxiosError: true,
      response: {
        status: statusCode,
        data: {
          statusCode,
          ok: false,
          code,
          detail: "Backend detail must not be displayed",
          data: null,
        },
      },
    };
    expect(getRegistrationErrorMessage(error)).toBe(message);
  });

  it("covers the complete catalog without omitted or extra codes", () => {
    expect(Object.keys(REGISTRATION_ERROR_MESSAGES).sort()).toEqual(ERROR_CASES.map(([code]) => code).sort());
  });

  it.each(["NEW_BACKEND_CODE", "toString", "__proto__"])("uses a safe fallback for %s", (code) => {
    expect(
      getRegistrationErrorMessage({
        isAxiosError: true,
        response: {
          status: 500,
          data: { statusCode: 500, ok: false, code, detail: "Private details", data: null },
        },
      }),
    ).toBe(DEFAULT_REGISTRATION_ERROR_MESSAGE);
  });

  it.each([
    null,
    new Error("Network failure"),
    { isAxiosError: true },
    { isAxiosError: true, response: { status: 500, data: {} } },
  ])("uses a safe fallback for malformed or network errors", (error) => {
    expect(getRegistrationErrorMessage(error)).toBe(DEFAULT_REGISTRATION_ERROR_MESSAGE);
  });
});
