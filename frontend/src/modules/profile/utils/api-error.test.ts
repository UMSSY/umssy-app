import { describe, expect, it } from "vitest";
import { buildAxiosError } from "../testing/profile-fixtures";
import { getApiErrorMessage, getApiFieldErrors } from "./api-error";

const FALLBACK = "Algo salió mal.";

describe("getApiErrorMessage", () => {
  it("uses the fallback for non HTTP errors", () => {
    expect(getApiErrorMessage(new Error("boom"), FALLBACK)).toBe(FALLBACK);
  });

  it("reports connection problems", () => {
    expect(getApiErrorMessage(buildAxiosError(null), FALLBACK)).toBe(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    );
  });

  it("reports files that are too large", () => {
    expect(getApiErrorMessage(buildAxiosError(413, { message: "File too large" }), FALLBACK)).toBe(
      "La fotografía no puede superar los 2 MB.",
    );
  });

  it("uses the message sent by the backend", () => {
    const error = buildAxiosError(400, { message: "Revisa los datos ingresados." });

    expect(getApiErrorMessage(error, FALLBACK)).toBe("Revisa los datos ingresados.");
  });

  it("uses the fallback when the backend message is not a string", () => {
    expect(getApiErrorMessage(buildAxiosError(400, { message: ["a", "b"] }), FALLBACK)).toBe(
      FALLBACK,
    );
    expect(getApiErrorMessage(buildAxiosError(500), FALLBACK)).toBe(FALLBACK);
  });
});

describe("getApiFieldErrors", () => {
  it("maps the backend field errors", () => {
    const error = buildAxiosError(400, {
      errors: [{ field: "phone", message: "El teléfono es obligatorio." }],
    });

    expect(getApiFieldErrors(error)).toEqual({ phone: "El teléfono es obligatorio." });
  });

  it("returns no errors for other failures", () => {
    expect(getApiFieldErrors(new Error("boom"))).toEqual({});
    expect(getApiFieldErrors(buildAxiosError(null))).toEqual({});
  });
});
