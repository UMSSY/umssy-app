import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PORTFOLIO_PROJECTS_QUERY_KEY,
  PORTFOLIO_REPOSITORIES_QUERY_KEY,
} from "../constants/portfolio-projects.constants";
import { portfolioProjectsService } from "../services/portfolio-projects.service";
import type {
  ExternalRepositoryItem,
  PortfolioProjectItem,
  UpdatePortfolioProjectsPayload,
} from "../types/portfolio-project.types";
import {
  usePortfolioProjects,
  usePortfolioRepositories,
  useSyncPortfolioProjects,
  useUpdatePortfolioProjects,
} from "./use-portfolio-projects";

vi.mock("../services/portfolio-projects.service", () => ({
  portfolioProjectsService: {
    getPortfolioProjects: vi.fn(),
    updatePortfolioProjects: vi.fn(),
    getAvailableRepositories: vi.fn(),
    syncPortfolioProjects: vi.fn(),
  },
}));

describe("use-portfolio-projects hooks", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("usePortfolioProjects", () => {
    it("returns the portfolio projects list on success", async () => {
      const mockProjects: PortfolioProjectItem[] = [
        {
          id: "p1",
          provider: "github",
          repoName: "project-alpha",
          repoUrl: "https://github.com/user/project-alpha",
          description: "Alpha project",
          language: "TypeScript",
          starsCount: 12,
          isOwner: true,
          displayOrder: 1,
        },
      ];
      vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValueOnce(mockProjects);

      const { result } = renderHook(() => usePortfolioProjects());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.isError).toBe(false);
    });

    it("returns an empty array and error state when service fails", async () => {
      vi.mocked(portfolioProjectsService.getPortfolioProjects).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      const { result } = renderHook(() => usePortfolioProjects());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.projects).toEqual([]);
      expect(result.current.isError).toBe(true);
    });
  });

  describe("useUpdatePortfolioProjects", () => {
    it("updates projects and invalidates query cache", async () => {
      const payload: UpdatePortfolioProjectsPayload = {
        projects: [
          {
            provider: "github",
            repoName: "project-beta",
            repoUrl: "https://github.com/user/project-beta",
            starsCount: 5,
            isOwner: false,
          },
        ],
      };
      const updatedProjects: PortfolioProjectItem[] = [
        {
          id: "p2",
          provider: "github",
          repoName: "project-beta",
          repoUrl: "https://github.com/user/project-beta",
          description: null,
          language: null,
          starsCount: 5,
          isOwner: false,
          displayOrder: 1,
        },
      ];
      vi.mocked(portfolioProjectsService.updatePortfolioProjects).mockResolvedValueOnce(
        updatedProjects,
      );

      const { result, client } = renderHook(() => useUpdatePortfolioProjects());
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync(payload);
      });

      expect(portfolioProjectsService.updatePortfolioProjects).toHaveBeenCalledWith(payload);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_PROJECTS_QUERY_KEY,
      });
    });
  });

  describe("usePortfolioRepositories", () => {
    it("fetches available repositories when enabled", async () => {
      const mockRepos: ExternalRepositoryItem[] = [
        {
          provider: "github",
          repoName: "test-repo",
          repoUrl: "https://github.com/user/test-repo",
          description: "Test description",
          language: "TypeScript",
          starsCount: 42,
          isOwner: true,
        },
      ];
      vi.mocked(
        portfolioProjectsService.getAvailableRepositories,
      ).mockResolvedValueOnce(mockRepos);

      const { result } = renderHook(() => usePortfolioRepositories(true));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.repositories).toEqual(mockRepos);
      expect(result.current.isError).toBe(false);
      expect(
        portfolioProjectsService.getAvailableRepositories,
      ).toHaveBeenCalledWith(undefined);
    });

    it("does not fetch repositories when enabled is false", () => {
      renderHook(() => usePortfolioRepositories(false));

      expect(
        portfolioProjectsService.getAvailableRepositories,
      ).not.toHaveBeenCalled();
    });

    it("handles error state when repository fetch fails", async () => {
      vi.mocked(
        portfolioProjectsService.getAvailableRepositories,
      ).mockRejectedValueOnce(new Error("Fetch failed"));

      const { result } = renderHook(() => usePortfolioRepositories(true));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.repositories).toEqual([]);
      expect(result.current.isError).toBe(true);
    });
  });

  describe("useSyncPortfolioProjects", () => {
    it("calls syncPortfolioProjects, updates cache data and invalidates projects and repositories", async () => {
      const syncedProjects: PortfolioProjectItem[] = [
        {
          id: "p1",
          provider: "github",
          repoName: "project-alpha",
          repoUrl: "https://github.com/user/project-alpha",
          description: "Updated description",
          language: "TypeScript",
          starsCount: 25,
          isOwner: true,
          displayOrder: 0,
        },
      ];
      vi.mocked(portfolioProjectsService.syncPortfolioProjects).mockResolvedValueOnce(
        syncedProjects,
      );

      const { result, client } = renderHook(() => useSyncPortfolioProjects());
      const setQueryDataSpy = vi.spyOn(client, "setQueryData");
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(portfolioProjectsService.syncPortfolioProjects).toHaveBeenCalledTimes(1);
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        PORTFOLIO_PROJECTS_QUERY_KEY,
        syncedProjects,
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_PROJECTS_QUERY_KEY,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_REPOSITORIES_QUERY_KEY,
      });
    });
  });
});

