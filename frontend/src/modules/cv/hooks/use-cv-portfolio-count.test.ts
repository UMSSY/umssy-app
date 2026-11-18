import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { PORTFOLIO_PROJECTS_QUERY_KEY, usePortfolioProjects } from "@/modules/profile";
import { portfolioProjectsService } from "@/modules/profile/services/portfolio-projects.service";
import type { PortfolioProjectItem } from "@/modules/profile";
import { useCvPortfolioCount } from "./use-cv-portfolio-count";

vi.mock("@/modules/profile/services/portfolio-projects.service", () => ({
  portfolioProjectsService: { getPortfolioProjects: vi.fn() },
}));

const PROJECT: PortfolioProjectItem = {
  id: "project-1", provider: "github", repoName: "app", repoUrl: "https://github.com/user/app",
  description: null, language: null, starsCount: 0, isOwner: true, displayOrder: 0,
};

describe("useCvPortfolioCount", () => {
  beforeEach(() => { vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue([PROJECT]); });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shares the portfolio request and cache with the profile consumer", async () => {
    const { result, client } = renderHook(() => ({ portfolio: usePortfolioProjects(), count: useCvPortfolioCount() }));
    await waitFor(() => expect(result.current.count).toBe(1));
    expect(result.current.portfolio.projects).toEqual([PROJECT]);
    expect(portfolioProjectsService.getPortfolioProjects).toHaveBeenCalledTimes(1);
    expect(client.getQueryCache().getAll().map(query => query.queryKey)).toEqual([PORTFOLIO_PROJECTS_QUERY_KEY]);

    act(() => client.setQueryData(PORTFOLIO_PROJECTS_QUERY_KEY, [PROJECT, { ...PROJECT, id: "project-2" }]));
    await waitFor(() => expect(result.current.count).toBe(2));
    expect(portfolioProjectsService.getPortfolioProjects).toHaveBeenCalledTimes(1);
  });

  it("updates the CV count after the shared portfolio query is invalidated", async () => {
    const { result, client } = renderHook(() => useCvPortfolioCount());
    await waitFor(() => expect(result.current).toBe(1));
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockResolvedValue([]);
    await act(async () => { await client.invalidateQueries({ queryKey: PORTFOLIO_PROJECTS_QUERY_KEY }); });
    await waitFor(() => expect(result.current).toBe(0));
  });

  it("defaults to zero when the portfolio request fails", async () => {
    vi.mocked(portfolioProjectsService.getPortfolioProjects).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => ({ count: useCvPortfolioCount(), portfolio: usePortfolioProjects() }));
    await waitFor(() => expect(result.current.portfolio.isError).toBe(true));
    expect(result.current.count).toBe(0);
  });
});
