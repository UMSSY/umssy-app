import { describe, expect, it } from "vitest";
import { getContactErrorMessage } from "./get-contact-error-message";

function buildHttpError(status: number) {
  return { isAxiosError: true, response: { status } };
}

describe("getContactErrorMessage", () => {
  it("explains that the application no longer allows direct communication when the server forbids it", () => {
    expect(getContactErrorMessage(buildHttpError(403))).toBe(
      "Esta postulación ya no permite la comunicación directa con el reclutador.",
    );
  });

  it("explains that there is no connection when the request got no response", () => {
    expect(getContactErrorMessage({ isAxiosError: true, response: undefined })).toBe(
      "No hay conexión a internet. Revisa tu conexión e intenta nuevamente.",
    );
  });

  it("falls back to a generic message for any other failure", () => {
    expect(getContactErrorMessage(buildHttpError(500))).toBe(
      "No pudimos abrir la conversación con el reclutador. Intenta nuevamente.",
    );
    expect(getContactErrorMessage(new Error("boom"))).toBe(
      "No pudimos abrir la conversación con el reclutador. Intenta nuevamente.",
    );
  });
});
