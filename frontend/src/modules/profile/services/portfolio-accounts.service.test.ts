import { apiClient } from "@/shared/services/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portfolioAccountsService } from "./portfolio-accounts.service";
import type {
  PortfolioAccountStatusResponse,
  PortfolioConnectedAccountResponse,
  PortfolioOAuthUrlResponse,
} from "../types/portfolio-account.types";

vi.mock("@/shared/services/storage/access-token-storage", () => ({
  getAccessToken: vi.fn().mockReturnValue("mock-token"),
}));

describe("portfolioAccountsService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSocialAccounts", () => {
    it("fetches the list of social accounts statuses", async () => {
      const mockAccounts: PortfolioAccountStatusResponse[] = [
        {
          provider: "github",
          connected: true,
          username: "valeriaq",
          profileUrl: "https://github.com/valeriaq",
        },
        {
          provider: "gitlab",
          connected: false,
          username: null,
          profileUrl: null,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockAccounts, ok: true, detail: "ok" },
      });

      const result = await portfolioAccountsService.getSocialAccounts();

      expect(apiClient.get).toHaveBeenCalledWith("/profile/portfolio/accounts", {
        headers: { Authorization: "Bearer mock-token" },
      });
      expect(result).toEqual(mockAccounts);
    });

    it("returns an empty array when data is nullish", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: null, ok: true, detail: "ok" },
      });

      const result = await portfolioAccountsService.getSocialAccounts();

      expect(result).toEqual([]);
    });
  });

  describe("getOAuthAuthorizationUrl", () => {
    it("fetches the authorization url without state", async () => {
      const mockUrlResponse: PortfolioOAuthUrlResponse = {
        url: "https://github.com/login/oauth/authorize?client_id=123",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockUrlResponse, ok: true, detail: "ok" },
      });

      const result = await portfolioAccountsService.getOAuthAuthorizationUrl("github");

      expect(apiClient.get).toHaveBeenCalledWith("/profile/portfolio/oauth/github/url", {
        params: undefined,
        headers: { Authorization: "Bearer mock-token" },
      });
      expect(result).toEqual(mockUrlResponse);
    });

    it("fetches the authorization url with state parameter", async () => {
      const mockUrlResponse: PortfolioOAuthUrlResponse = {
        url: "https://gitlab.com/oauth/authorize?client_id=456&state=gitlab",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockUrlResponse, ok: true, detail: "ok" },
      });

      const result = await portfolioAccountsService.getOAuthAuthorizationUrl("gitlab", "gitlab");

      expect(apiClient.get).toHaveBeenCalledWith("/profile/portfolio/oauth/gitlab/url", {
        params: { state: "gitlab" },
        headers: { Authorization: "Bearer mock-token" },
      });
      expect(result).toEqual(mockUrlResponse);
    });
  });

  describe("completeOAuthCallback", () => {
    it("posts the oauth authorization code to the provider callback endpoint", async () => {
      const mockResponse: PortfolioConnectedAccountResponse = {
        id: "account-1",
        provider: "github",
        username: "valeriaq",
        profileUrl: "https://github.com/valeriaq",
        connected: true,
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: { statusCode: 200, data: mockResponse, ok: true, detail: "ok" },
      });

      const result = await portfolioAccountsService.completeOAuthCallback("github", {
        code: "github-code-123",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/profile/portfolio/oauth/github/callback",
        { code: "github-code-123" },
        { headers: { Authorization: "Bearer mock-token" } },
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

