import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PORTFOLIO_ACCOUNTS_QUERY_KEY } from "../constants/portfolio-accounts.constants";
import {
  PORTFOLIO_PROJECTS_QUERY_KEY,
  PORTFOLIO_REPOSITORIES_QUERY_KEY,
} from "../constants/portfolio-projects.constants";
import { portfolioAccountsService } from "../services/portfolio-accounts.service";
import * as assignLocationModule from "../utils/assign-window-location";
import * as sessionStorageService from "@/shared/services/storage/browser-session-storage";
import type { PortfolioAccountStatusResponse } from "../types/portfolio-account-status-response.types";
import type { PortfolioConnectedAccountResponse } from "../types/portfolio-connected-account-response.types";
import type { PortfolioOAuthUrlResponse } from "../types/portfolio-oauth-url-response.types";
import {
  useCompletePortfolioOAuth,
  useDisconnectPortfolioAccount,
  usePortfolioAccounts,
  useStartPortfolioOAuth,
} from "./use-portfolio-accounts";

vi.mock("../utils/portfolio-oauth", () => ({ preparePortfolioAuthorization: vi.fn().mockResolvedValue({ value: "test-verifier", challenge: "test-challenge" }) }));

vi.mock("../services/portfolio-accounts.service", () => ({
  portfolioAccountsService: {
    getSocialAccounts: vi.fn(),
    getOAuthAuthorizationUrl: vi.fn(),
    completeOAuthCallback: vi.fn(),
    disconnectSocialAccount: vi.fn(),
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
    it("does not redirect GitLab if the authorization attempt cannot be stored", async () => {
      vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockResolvedValueOnce({
        url: "https://gitlab.com/oauth/authorize?state=gitlab-test-state",
      });
      vi.spyOn(sessionStorageService, "writeSessionStorage").mockReturnValue(false);
      const assignSpy = vi.spyOn(assignLocationModule, "assignWindowLocation").mockImplementation(() => {});
      const { result } = renderHook(() => useStartPortfolioOAuth());
      await act(async () => {
        await expect(result.current.mutateAsync({ provider: "gitlab" })).rejects.toThrow();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });
    it("does not redirect when the authorization attempt cannot be stored", async () => {
      vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockResolvedValueOnce({
        url: "https://github.com/login/oauth/authorize?state=github-test-state",
      });
      vi.spyOn(sessionStorageService, "writeSessionStorage").mockReturnValue(false);
      const assignSpy = vi.spyOn(assignLocationModule, "assignWindowLocation").mockImplementation(() => {});
      const { result } = renderHook(() => useStartPortfolioOAuth());
      await act(async () => {
        await expect(result.current.mutateAsync({ provider: "github" })).rejects.toThrow();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });
    it("fetches authorization url and assigns it to window location", async () => {
      const mockUrlResponse: PortfolioOAuthUrlResponse = {
        url: "https://github.com/login/oauth/authorize?client_id=123&state=github-test-state",
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
        undefined,
        "test-challenge",
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

  describe("useDisconnectPortfolioAccount", () => {
    it("calls disconnectSocialAccount and invalidates accounts, projects, and repositories queries", async () => {
      vi.mocked(portfolioAccountsService.disconnectSocialAccount).mockResolvedValueOnce({
        provider: "github",
        connected: false,
      });

      const { result, client } = renderHook(() => useDisconnectPortfolioAccount());
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync("github");
      });

      expect(portfolioAccountsService.disconnectSocialAccount).toHaveBeenCalledWith("github");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_ACCOUNTS_QUERY_KEY,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_PROJECTS_QUERY_KEY,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: PORTFOLIO_REPOSITORIES_QUERY_KEY,
      });
    });
  });
});
