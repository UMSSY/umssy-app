import { describe, expect, it } from "vitest";
import { getCvExportErrorMessage } from "./get-cv-export-error-message";

describe("getCvExportErrorMessage", () => {
  it("explains an expired session", () => {
    expect(getCvExportErrorMessage({ response: { status: 401 } })).toBe(
      "Tu sesión no es válida. Inicia sesión nuevamente.",
    );
  });

  it("explains a role without permission", () => {
    expect(getCvExportErrorMessage({ response: { status: 403 } })).toBe(
      "Tu cuenta no tiene permiso para generar un CV.",
    );
  });

  it("explains a profile that was not found", () => {
    expect(getCvExportErrorMessage({ response: { status: 404 } })).toBe(
      "No encontramos tu perfil. Completa tus datos e intenta de nuevo.",
    );
  });

  it("uses the generic message for any other status", () => {
    expect(getCvExportErrorMessage({ response: { status: 500 } })).toBe(
      "No se pudo generar tu CV. Intenta de nuevo.",
    );
  });

  it("uses the generic message for a network error", () => {
    expect(getCvExportErrorMessage(new Error("Network Error"))).toBe(
      "No se pudo generar tu CV. Intenta de nuevo.",
    );
  });
});
