import { apiClient } from "@/shared/services/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portfolioProjectsService } from "./portfolio-projects.service";
import type {
  PortfolioProjectItem,
  UpdatePortfolioProjectsPayload,
} from "../types/portfolio-project.types";

vi.mock("@/shared/services/storage/access-token-storage", () => ({
  getAccessToken: vi.fn().mockReturnValue("mock-token"),
}));

describe("portfolioProjectsService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPortfolioProjects", () => {
    it("fetches the user portfolio projects", async () => {
      const mockProjects: PortfolioProjectItem[] = [
        {
          id: "proj-1",
          provider: "github",
          repoName: "umssy-app",
          repoUrl: "https://github.com/UMSSY/umssy-app",
          description: "Plataforma de graduados",
          language: "TypeScript",
          starsCount: 15,
          isOwner: true,
          displayOrder: 1,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockProjects, ok: true, detail: "ok" },
      });

      const result = await portfolioProjectsService.getPortfolioProjects();

      expect(apiClient.get).toHaveBeenCalledWith("/profile/portfolio/projects", {
        headers: { Authorization: "Bearer mock-token" },
      });
      expect(result).toEqual(mockProjects);
    });

    it("returns an empty array when response data is nullish", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: null, ok: true, detail: "ok" },
      });

      const result = await portfolioProjectsService.getPortfolioProjects();

      expect(result).toEqual([]);
    });
  });

  describe("updatePortfolioProjects", () => {
    it("updates the portfolio projects list", async () => {
      const payload: UpdatePortfolioProjectsPayload = {
        projects: [
          {
            provider: "github",
            repoName: "umssy-app",
            repoUrl: "https://github.com/UMSSY/umssy-app",
            description: "Plataforma de graduados",
            language: "TypeScript",
            starsCount: 15,
            isOwner: true,
          },
        ],
      };

      const updatedProjects: PortfolioProjectItem[] = [
        {
          id: "proj-1",
          provider: "github",
          repoName: "umssy-app",
          repoUrl: "https://github.com/UMSSY/umssy-app",
          description: "Plataforma de graduados",
          language: "TypeScript",
          starsCount: 15,
          isOwner: true,
          displayOrder: 1,
        },
      ];

      vi.spyOn(apiClient, "put").mockResolvedValueOnce({
        data: { statusCode: 200, data: updatedProjects, ok: true, detail: "ok" },
      });

      const result = await portfolioProjectsService.updatePortfolioProjects(payload);

      expect(apiClient.put).toHaveBeenCalledWith(
        "/profile/portfolio/projects",
        payload,
        {
          headers: { Authorization: "Bearer mock-token" },
        },
      );
      expect(result).toEqual(updatedProjects);
    });
  });
});

