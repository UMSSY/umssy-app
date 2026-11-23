import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { notificationPreferencesService } from "../services/notification-preferences.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}));

const PREFERENCES = { pushEnabled: false, emailEnabled: true, inAppEnabled: true };

afterEach(() => vi.resetAllMocks());

describe("notificationPreferencesService", () => {
  it("lee las preferencias y desenvuelve la respuesta del backend", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "OK", data: PREFERENCES },
    });

    await expect(notificationPreferencesService.get()).resolves.toEqual(PREFERENCES);
    expect(apiClient.get).toHaveBeenCalledExactlyOnceWith("/notifications/preferences");
  });

  it("envía las tres preferencias con PUT", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    const next = { pushEnabled: true, emailEnabled: false, inAppEnabled: true };

    await notificationPreferencesService.update(next);

    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith("/notifications/preferences", next);
  });

  it("propaga el error cuando el PUT falla", async () => {
    vi.mocked(apiClient.put).mockRejectedValue(new Error("Network Error"));

    await expect(notificationPreferencesService.update(PREFERENCES)).rejects.toThrow("Network Error");
  });
});