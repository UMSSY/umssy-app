import { describe, expect, it } from "vitest";
import { getHistoryErrorMessage } from "./get-history-error-message";

describe("getHistoryErrorMessage", () => {
  it("uses the history message for network errors", () => {
    expect(getHistoryErrorMessage(new Error("Network failed"))).toBe("No fue posible cargar tu historial. Inténtalo de nuevo.");
  });

  it("preserves the registration authentication message", () => {
    expect(getHistoryErrorMessage({ isAxiosError: true, response: { status: 401, data: { statusCode: 401, ok: false, code: "UNAUTHENTICATED", detail: "Sesión inválida", data: null } } })).toBe("Inicia sesión para continuar.");
  });
});
