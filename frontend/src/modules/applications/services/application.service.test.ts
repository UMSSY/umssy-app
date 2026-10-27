import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { buildApplication } from "../testing/application-fixtures";
import { applicationService } from "./application.service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applicationService", () => {
  it("lists the applications of the authenticated person through the shared client", async () => {
    const applications = [buildApplication()];
    const request = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "Operación exitosa", data: applications },
    });

    await expect(applicationService.getMine()).resolves.toBe(applications);
    expect(request).toHaveBeenCalledWith("/applications/me");
  });

  it("withdraws an application through the shared client", async () => {
    const request = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: {} });

    await expect(applicationService.withdraw("application-1")).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith("/applications/application-1/withdraw");
  });

  it("propagates the failure so the query can show the error state", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network Error"));

    await expect(applicationService.getMine()).rejects.toThrow("Network Error");
  });
});
