import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { accountActivationService } from "./account-activation.service";

vi.mock("@/shared/services/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/api-client")>()),
  apiClient: { request: vi.fn() },
}));
const request = vi.mocked(apiClient.request);

const ok = (data: unknown) => ({ status: 200, data: { statusCode: 200, ok: true, data } });
const fail = (status: number, data: unknown) => ({ status, data });

beforeEach(() => {
  request.mockReset();
});

describe("accountActivationService", () => {
  it("lee el estado y desenvuelve la respuesta", async () => {
    request.mockResolvedValue(ok({ state: "ready", serverTime: "t", expiresAt: "e", resendAvailableAt: "r", resendsRemaining: 3, remainingAttempts: 5 }) as never);
    const result = await accountActivationService.getStatus("a@b.com");
    expect(result).toMatchObject({ ok: true, data: { state: "ready", remainingAttempts: 5 } });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: "get", params: { email: "a@b.com" } }));
  });

  it("rechaza un estado desconocido", async () => {
    request.mockResolvedValue(ok({ state: "otro", serverTime: "t" }) as never);
    expect(await accountActivationService.getStatus("a@b.com")).toMatchObject({ ok: false });
  });

  it("mapea el código inválido con intentos restantes", async () => {
    request.mockResolvedValue(fail(400, { detail: "Código incorrecto", ok: false, data: { reason: "code_invalid", remainingAttempts: 3 } }) as never);
    expect(await accountActivationService.verifyCode("a@b.com", "111111")).toMatchObject({
      ok: false,
      reason: "code_invalid",
      remainingAttempts: 3,
      message: "Código incorrecto",
    });
  });

  it("mapea errores de validación por campo", async () => {
    request.mockResolvedValue(fail(400, { detail: "Datos inválidos", errors: [{ field: "password", message: "Muy corta" }] }) as never);
    const result = await accountActivationService.activate("a@b.com", "123456", "x");
    expect(result).toMatchObject({ ok: false, fieldErrors: { password: "Muy corta" } });
  });

  it("devuelve la sesión al activar", async () => {
    request.mockResolvedValue(ok({ accessToken: "tok", roleTag: "titulado", roles: ["titulado"] }) as never);
    expect(await accountActivationService.activate("a@b.com", "123456", "Abcdefg1")).toEqual({
      ok: true,
      data: { accessToken: "tok", roleTag: "titulado", roles: ["titulado"] },
    });
  });

  it("informa el cooldown del reenvío", async () => {
    request.mockResolvedValue(fail(429, { detail: "Espera", data: { reason: "resend_cooldown", retryAfterSeconds: 42 } }) as never);
    expect(await accountActivationService.resend("a@b.com")).toMatchObject({ reason: "resend_cooldown", retryAfterSeconds: 42 });
  });

  it("informa error de red", async () => {
    request.mockRejectedValue(new Error("Network Error"));
    expect(await accountActivationService.resend("a@b.com")).toMatchObject({ ok: false, status: 0 });
  });
});
