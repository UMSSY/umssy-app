import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { homeService } from "./home.service";

describe("homeService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getWelcomeMessage devuelve el dato del formato estándar (response.data.data)", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: { statusCode: 200, ok: true, detail: "Operación exitosa", data: "Hello World!" },
    });

    await expect(homeService.getWelcomeMessage()).resolves.toBe("Hello World!");
  });
});
