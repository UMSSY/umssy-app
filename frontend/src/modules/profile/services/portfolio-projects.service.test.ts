import { apiClient } from "@/shared/services/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portfolioProjectsService } from "./portfolio-projects.service";
import type {
  ExternalRepositoryItem,
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

  describe("getAvailableRepositories", () => {
    it("fetches available repositories with auth headers and optional provider", async () => {
      const mockRepos: ExternalRepositoryItem[] = [
        {
          provider: "github",
          repoName: "umssy-frontend",
          repoUrl: "https://github.com/UMSSY/umssy-frontend",
          description: "Frontend repo",
          language: "TypeScript",
          starsCount: 12,
          isOwner: true,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockRepos, ok: true, detail: "ok" },
      });

      const result =
        await portfolioProjectsService.getAvailableRepositories("github");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/profile/portfolio/repositories",
        {
          headers: { Authorization: "Bearer mock-token" },
          params: { provider: "github" },
        },
      );
      expect(result).toEqual(mockRepos);
    });

    it("fetches all repositories when provider is undefined and handles nullish response", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: null, ok: true, detail: "ok" },
      });

      const result = await portfolioProjectsService.getAvailableRepositories();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/profile/portfolio/repositories",
        {
          headers: { Authorization: "Bearer mock-token" },
          params: undefined,
        },
      );
      expect(result).toEqual([]);
    });
  });

  describe("syncPortfolioProjects", () => {
    it("posts to sync endpoint and returns updated portfolio projects", async () => {
      const mockProjects: PortfolioProjectItem[] = [
        {
          id: "proj-1",
          provider: "github",
          repoName: "umssy-app",
          repoUrl: "https://github.com/UMSSY/umssy-app",
          description: "Updated description",
          language: "TypeScript",
          starsCount: 20,
          isOwner: true,
          displayOrder: 0,
        },
      ];

      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockProjects, ok: true, detail: "ok" },
      });

      const result = await portfolioProjectsService.syncPortfolioProjects();

      expect(apiClient.post).toHaveBeenCalledWith(
        "/profile/portfolio/projects/sync",
        {},
        { headers: { Authorization: "Bearer mock-token" } },
      );
      expect(result).toEqual(mockProjects);
    });

    it("returns an empty array when response data is nullish", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: { statusCode: 200, data: null, ok: true, detail: "ok" },
      });

      const result = await portfolioProjectsService.syncPortfolioProjects();

      expect(result).toEqual([]);
    });
  });
});

