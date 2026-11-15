import { describe, expect, it } from "vitest";
import { getCvExtractionError } from "./get-cv-extraction-error";

function httpError(status: number, code?: string) {
  return { response: { status, data: code ? { statusCode: status, code, ok: false } : null } };
}

describe("getCvExtractionError", () => {
  it("explains that a scanned pdf cannot be read and does not offer a retry", () => {
    expect(getCvExtractionError(httpError(422, "CV_UNREADABLE"))).toEqual({
      message: expect.stringContaining("no tiene texto seleccionable"),
      isRetryable: false,
    });
  });

  it("offers a retry when the pdf could not be processed", () => {
    expect(getCvExtractionError(httpError(422, "CV_EXTRACTION_FAILED"))).toEqual({
      message: "No pudimos procesar el contenido de tu PDF. Intenta de nuevo en unos segundos.",
      isRetryable: true,
    });
  });

  it.each([httpError(404, "CV_NOT_FOUND"), httpError(404)])("asks to reload when the cv no longer exists", (error) => {
    expect(getCvExtractionError(error)).toEqual({
      message: "No encontramos este CV. Puede que se haya eliminado; recarga la página.",
      isRetryable: false,
    });
  });

  it.each([new Error("Network Error"), { response: {} }, null, "timeout"])(
    "treats a missing response as a network error that can be retried",
    (error) => {
      expect(getCvExtractionError(error)).toEqual({
        message: "No pudimos conectarnos con el servidor. Revisa tu conexión e intenta de nuevo.",
        isRetryable: true,
      });
    },
  );

  it.each([500, 503, 408, 429])("offers a retry for the transient status %i", (status) => {
    expect(getCvExtractionError(httpError(status))).toEqual({
      message: "El servidor no pudo leer tu CV en este momento. Intenta de nuevo en unos segundos.",
      isRetryable: true,
    });
  });

  it("asks to sign in again when the session expired", () => {
    expect(getCvExtractionError(httpError(401, "HTTP_ERROR"))).toEqual({
      message: "Tu sesión no es válida. Inicia sesión nuevamente.",
      isRetryable: false,
    });
  });

  it("uses a generic message without retry for other client errors", () => {
    expect(getCvExtractionError(httpError(400, "VALIDATION_ERROR"))).toEqual({
      message: "No se pudieron leer los datos de tu CV.",
      isRetryable: false,
    });
  });
});
