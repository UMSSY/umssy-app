import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { authService } from "./auth.service";

describe("authService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("login devuelve el dato del formato estándar (response.data.data)", async () => {
    const payload = { email: "a@b.co", password: "x", roleTag: "titulado" } as never;
    const post = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: { statusCode: 201, ok: true, detail: "Operación exitosa", data: { accessToken: "token-de-prueba" } },
    });

    await expect(authService.login(payload)).resolves.toEqual({ accessToken: "token-de-prueba" });
    expect(post).toHaveBeenCalledWith("/auth/login", payload);
  });
});
