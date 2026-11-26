import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { companiesService } from "./companies.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: { get: vi.fn() },
}));
vi.mock("@/shared/config/env.config", () => ({
  ENV_CONFIG: { apiUrl: "http://localhost:8080/api" },
}));

describe("companiesService", () => {
  it("loads the featured companies and builds the full logo URL", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [
          { id: "a", name: "Andes Data", sector: "Datos", description: null, logoUrl: "/companies/a/logo", activeVacanciesCount: 2 },
          { id: "b", name: "Tecnosoft", sector: null, description: "Software", logoUrl: null, activeVacanciesCount: 1 },
        ],
      },
    });

    await expect(companiesService.getFeaturedCompanies()).resolves.toEqual([
      { id: "a", name: "Andes Data", sector: "Datos", description: null, logoUrl: "http://localhost:8080/api/companies/a/logo", activeVacanciesCount: 2 },
      { id: "b", name: "Tecnosoft", sector: null, description: "Software", logoUrl: null, activeVacanciesCount: 1 },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith("/companies/featured");
  });
});
