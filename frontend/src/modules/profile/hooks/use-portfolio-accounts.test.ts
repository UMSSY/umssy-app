import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PORTFOLIO_ACCOUNTS_QUERY_KEY } from "../constants/portfolio-accounts.constants";
import { portfolioAccountsService } from "../services/portfolio-accounts.service";
import * as assignLocationModule from "../utils/assign-window-location";
import type {
  PortfolioAccountStatusResponse,
  PortfolioConnectedAccountResponse,
  PortfolioOAuthUrlResponse,
} from "../types/portfolio-account.types";
import {
  useCompletePortfolioOAuth,
  usePortfolioAccounts,
  useStartPortfolioOAuth,
} from "./use-portfolio-accounts";

vi.mock("../services/portfolio-accounts.service", () => ({
  portfolioAccountsService: {
    getSocialAccounts: vi.fn(),
    getOAuthAuthorizationUrl: vi.fn(),
    completeOAuthCallback: vi.fn(),
  },
}));

describe("use-portfolio-accounts hooks", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("usePortfolioAccounts", () => {
    it("returns the portfolio accounts on success", async () => {
      const mockAccounts: PortfolioAccountStatusResponse[] = [
        {
          provider: "github",
          connected: true,
          username: "valeriaq",
          profileUrl: "https://github.com/valeriaq",
        },
      ];
      vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValueOnce(mockAccounts);

      const { result } = renderHook(() => usePortfolioAccounts());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.accounts).toEqual(mockAccounts);
      expect(result.current.isError).toBe(false);
    });

    it("returns an empty array when service fails", async () => {
      vi.mocked(portfolioAccountsService.getSocialAccounts).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      const { result } = renderHook(() => usePortfolioAccounts());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.accounts).toEqual([]);
      expect(result.current.isError).toBe(true);
    });
  });

  describe("useStartPortfolioOAuth", () => {
    it("fetches authorization url and assigns it to window location", async () => {
      const mockUrlResponse: PortfolioOAuthUrlResponse = {
        url: "https://github.com/login/oauth/authorize?client_id=123",
      };
      vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockResolvedValueOnce(
        mockUrlResponse,
      );
      const assignSpy = vi
        .spyOn(assignLocationModule, "assignWindowLocation")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useStartPortfolioOAuth());

      await act(async () => {
        await result.current.mutateAsync({ provider: "github", state: "github" });
      });

      expect(portfolioAccountsService.getOAuthAuthorizationUrl).toHaveBeenCalledWith(
        "github",
        "github",
      );
      expect(assignSpy).toHaveBeenCalledWith(mockUrlResponse.url);
    });
  });

  describe("useCompletePortfolioOAuth", () => {
    it("exchanges the code and invalidates the accounts query", async () => {
      const mockConnectedResponse: PortfolioConnectedAccountResponse = {
        id: "acc-1",
        provider: "github",
        username: "valeriaq",
        profileUrl: "https://github.com/valeriaq",
        connected: true,
      };
      vi.mocked(portfolioAccountsService.completeOAuthCallback).mockResolvedValueOnce(
        mockConnectedResponse,
      );

      const { result, client } = renderHook(() => useCompletePortfolioOAuth());
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync({
          provider: "github",
          payload: { code: "code-abc" },
        });
      });

      expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith("github", {
        code: "code-abc",
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_ACCOUNTS_QUERY_KEY,
      });
    });
  });
});
