import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { jobAlertPreferenceService } from "./job-alert-preference.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}));

const PREFERENCE = { mode: "MATCHING", savedMode: "MATCHING", canFilterByProfile: true };

afterEach(() => vi.resetAllMocks());

describe("jobAlertPreferenceService", () => {
  it("lee la preferencia y desenvuelve la respuesta del backend", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "OK", data: PREFERENCE },
    });

    await expect(jobAlertPreferenceService.get()).resolves.toEqual(PREFERENCE);
    expect(apiClient.get).toHaveBeenCalledExactlyOnceWith("/job-offers/alert-preference");
  });

  it("guarda el modo elegido con PUT y devuelve la preferencia resultante", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "OK", data: PREFERENCE },
    });

    await expect(jobAlertPreferenceService.update("MATCHING")).resolves.toEqual(PREFERENCE);
    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith("/job-offers/alert-preference", {
      mode: "MATCHING",
    });
  });

  it("propaga el error cuando el PUT falla", async () => {
    vi.mocked(apiClient.put).mockRejectedValue(new Error("Network Error"));

    await expect(jobAlertPreferenceService.update("HIGH_AFFINITY")).rejects.toThrow("Network Error");
  });
});
