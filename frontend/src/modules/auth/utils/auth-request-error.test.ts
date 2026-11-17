// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosHeaders } from "axios";
import { AuthRequestError } from "../errors/auth-request.error";
import { getCredentialLimit, toAuthRequestError } from "./auth-request-error";

function responseError(code = "LOGIN_ATTEMPTS_LIMIT", data: unknown = { retryAfterSeconds: 900 }, headers: unknown = {}) {
  return { response: { status: 429, headers, data: { code, detail: "Inténtalo más tarde.", data } } };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-16T20:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("getCredentialLimit", () => {
  it.each([
    ["LOGIN_ATTEMPTS_LIMIT", "login"],
    ["PASSWORD_RESET_REQUEST_LIMIT", "request"],
    ["PASSWORD_RESET_VERIFICATION_LIMIT", "verify"],
    ["PASSWORD_RESET_CONFIRMATION_LIMIT", "reset"],
    ["PASSWORD_RESET_COOLDOWN", "request"],
  ])("reconoce la operación correspondiente a %s", (code, operation) => {
    expect(getCredentialLimit(responseError(code))).toEqual({
      code, operation, retryAfterSeconds: 900, retryAt: Date.now() + 900_000,
    });
  });

  it.each([{ "retry-after": "120" }, { "Retry-After": "120" }, new AxiosHeaders({ "Retry-After": "120" })])(
    "prioriza Retry-After sobre los datos del cuerpo: %j",
    (headers) => {
      expect(getCredentialLimit(responseError(undefined, { retryAfterSeconds: 900, retryAt: "2000-01-01" }, headers))?.retryAfterSeconds).toBe(120);
    },
  );

  it("utiliza el cuerpo si la cabecera no contiene una espera numérica válida", () => {
    expect(getCredentialLimit(responseError(undefined, { retryAfterSeconds: 300 }, { "retry-after": "inválido" }))?.retryAfterSeconds).toBe(300);
  });

  it("admite retryAt como alternativa y redondea hacia arriba", () => {
    expect(getCredentialLimit(responseError(undefined, { retryAt: new Date(Date.now() + 1500).toISOString() }))?.retryAfterSeconds).toBe(2);
  });

  it.each([0, -1, NaN, Infinity, "", "texto", null, true, {}, Number.MAX_VALUE])(
    "descarta una espera inutilizable: %s",
    (retryAfterSeconds) => expect(getCredentialLimit(responseError(undefined, { retryAfterSeconds }))).toBeNull(),
  );

  it.each([null, {}, new Error("Sin conexión"), { response: { status: 500 } }, responseError("UNKNOWN"), responseError("toString")])(
    "no inventa un bloqueo para otros errores: %s",
    (cause) => expect(getCredentialLimit(cause)).toBeNull(),
  );

  it("no interpreta otros estados HTTP como un límite", () => {
    const cause = responseError();
    cause.response.status = 401;
    expect(getCredentialLimit(cause)).toBeNull();
  });

  it("rechaza metadatos que corresponden a otra operación", () => {
    expect(getCredentialLimit(responseError(undefined, { operation: "request", retryAfterSeconds: 900 }))).toBeNull();
  });

  it.each(["inválido", "2000-01-01T00:00:00Z"])("descarta una fecha inválida o vencida: %s", (retryAt) => {
    expect(getCredentialLimit(responseError(undefined, { retryAt }))).toBeNull();
  });
});

describe("toAuthRequestError", () => {
  it("conserva el mensaje, el estado, el código y la espera del servidor", () => {
    const error = toAuthRequestError(responseError(), "Error genérico");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthRequestError);
    expect(error.message).toBe("Inténtalo más tarde.");
    expect(error.status).toBe(429);
    expect(error.code).toBe("LOGIN_ATTEMPTS_LIMIT");
    expect(getCredentialLimit(error)).toEqual(getCredentialLimit(responseError()));
    expect(toAuthRequestError(error, "Otro mensaje")).toBe(error);
  });

  it("conserva errores de negocio aunque no incluyan tiempos de bloqueo", () => {
    const error = toAuthRequestError({ response: { status: 400, data: { detail: "El código no es válido.", code: "INVALID_RESET_CODE" } } }, "Error");
    expect(error.message).toBe("El código no es válido.");
    expect(error.status).toBe(400);
    expect(error.code).toBe("INVALID_RESET_CODE");
    expect(error.credentialLimit).toBeNull();
  });

  it("conserva el mensaje original de un error sin respuesta HTTP", () => {
    const error = toAuthRequestError(new Error("Sin conexión"), "Error genérico");
    expect(error.message).toBe("Sin conexión");
    expect(error.status).toBeUndefined();
    expect(error.code).toBeUndefined();
    expect(error.credentialLimit).toBeNull();
  });

  it.each([null, "desconocido", { response: { data: { detail: 12 } } }, new Error("")])(
    "utiliza el mensaje alternativo si no hay un detalle útil: %s",
    (cause) => expect(toAuthRequestError(cause, "No se pudo continuar.").message).toBe("No se pudo continuar."),
  );
});
