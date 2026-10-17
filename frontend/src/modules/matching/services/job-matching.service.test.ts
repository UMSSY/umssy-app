import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { buildJob, buildMatch } from "../testing/job-fixtures";
import { jobMatchingService } from "./job-matching.service";

vi.mock("@/shared/services/api-client", () => ({ apiClient: { get: vi.fn() } }));

describe("jobMatchingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lee las recomendaciones de response.data.data", async () => {
    const result = { isProfileComplete: true, items: [buildJob()] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: { statusCode: 200, ok: true, detail: "", data: result } });

    await expect(jobMatchingService.getRecommendations()).resolves.toEqual(result);
    expect(apiClient.get).toHaveBeenCalledWith("/job-offers/recommendations");
  });

  it("lee el detalle de la vacante de response.data.data", async () => {
    const match = buildMatch();
    vi.mocked(apiClient.get).mockResolvedValue({ data: { statusCode: 200, ok: true, detail: "", data: match } });

    await expect(jobMatchingService.getJobMatch("o1")).resolves.toEqual(match);
    expect(apiClient.get).toHaveBeenCalledWith("/job-offers/o1/match");
  });

  it("propaga los errores del cliente HTTP", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("fallo"));

    await expect(jobMatchingService.getJobMatch("o1")).rejects.toThrow("fallo");
  });
});
