// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { getCredentialLimit } from "../utils/auth-request-error";
import { AuthRequestError } from "../errors/auth-request.error";
import { authService } from "./auth.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: { defaults: { baseURL: "http://localhost:8080/api" }, post: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("errores de límites en los servicios de autenticación", () => {
  const cases = [
    ["login", () => authService.login({ email: "user@example.test", password: "Password1" }), "LOGIN_ATTEMPTS_LIMIT", "login"],
    ["solicitud", () => authService.requestPasswordResetCode({ email: "user@example.test" }), "PASSWORD_RESET_REQUEST_LIMIT", "request"],
    ["verificación", () => authService.verifyPasswordResetCode({ email: "user@example.test", code: "123456" }), "PASSWORD_RESET_VERIFICATION_LIMIT", "verify"],
    ["confirmación", () => authService.resetPassword({ email: "user@example.test", code: "123456", password: "NewPassword1" }), "PASSWORD_RESET_CONFIRMATION_LIMIT", "reset"],
  ] as const;

  it.each(cases)("conserva la restricción recibida al realizar %s", async (_, request, code, operation) => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: { status: 429, headers: { "retry-after": "120" }, data: {
        code, detail: "Inténtalo más tarde.", data: { operation, retryAfterSeconds: 900 },
      } },
    });
    const error: unknown = await request().catch((cause: unknown) => cause);
    expect(getCredentialLimit(error)).toMatchObject({ code, operation, retryAfterSeconds: 120 });
    if (operation !== "login") {
      expect(error).toBeInstanceOf(AuthRequestError);
      expect((error as AuthRequestError).message).toBe("Inténtalo más tarde.");
    }
  });

  it("conserva el mensaje de un error de recuperación sin restricción", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Sin conexión"));
    await expect(authService.requestPasswordResetCode({ email: "user@example.test" })).rejects.toThrow("Sin conexión");
  });
});
