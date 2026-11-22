"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PORTFOLIO_ACCOUNTS_QUERY_KEY,
} from "../constants/portfolio-accounts.constants";
import {
  PORTFOLIO_PROJECTS_QUERY_KEY,
  PORTFOLIO_REPOSITORIES_QUERY_KEY,
} from "../constants/portfolio-projects.constants";
import { portfolioAccountsService } from "../services/portfolio-accounts.service";
import { assignWindowLocation } from "../utils/assign-window-location";
import { prepareGithubAuthorization } from "../utils/github-oauth";
import { saveGithubOAuthAttempt } from "../utils/github-oauth-storage";
import type { PortfolioAccountDisconnectResponse } from "../types/portfolio-account-disconnect-response.types";
import type { PortfolioAccountStatusResponse } from "../types/portfolio-account-status-response.types";
import type { PortfolioConnectedAccountResponse } from "../types/portfolio-connected-account-response.types";
import type { PortfolioOAuthCallbackPayload } from "../types/portfolio-oauth-callback-payload.types";
import type { PortfolioOAuthUrlResponse } from "../types/portfolio-oauth-url-response.types";
import type { PortfolioProviderName } from "../types/portfolio-provider-name.types";

export function usePortfolioAccounts() {
  const query = useQuery<PortfolioAccountStatusResponse[]>({
    queryKey: PORTFOLIO_ACCOUNTS_QUERY_KEY,
    queryFn: () => portfolioAccountsService.getSocialAccounts(),
    retry: false,
  });

  return {
    accounts: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStartPortfolioOAuth() {
  return useMutation<
    PortfolioOAuthUrlResponse,
    Error,
    { provider: PortfolioProviderName; state?: string }
  >({
    mutationFn: async ({ provider, state }) => {
      if (provider === "github") {
        const verifier = await prepareGithubAuthorization();
        const result = await portfolioAccountsService.getOAuthAuthorizationUrl(provider, undefined, verifier.challenge);
        const oauthState = new URL(result.url).searchParams.get("state");
        if (!oauthState) throw new Error("No se pudo iniciar la conexión con GitHub.");
        if (!saveGithubOAuthAttempt(oauthState, verifier.value)) throw new Error("No se pudo iniciar la conexión con GitHub.");
        assignWindowLocation(result.url);
        return result;
      }
      const result = await portfolioAccountsService.getOAuthAuthorizationUrl(provider, state);
      if (result?.url) {
        assignWindowLocation(result.url);
      }
      return result;
    },
  });
}

export function useCompletePortfolioOAuth() {
  const queryClient = useQueryClient();

  return useMutation<
    PortfolioConnectedAccountResponse,
    Error,
    { provider: PortfolioProviderName; payload: PortfolioOAuthCallbackPayload }
  >({
    mutationFn: ({ provider, payload }) =>
      portfolioAccountsService.completeOAuthCallback(provider, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PORTFOLIO_ACCOUNTS_QUERY_KEY });
    },
  });
}

export function useDisconnectPortfolioAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    PortfolioAccountDisconnectResponse,
    Error,
    PortfolioProviderName
  >({
    mutationFn: (provider) =>
      portfolioAccountsService.disconnectSocialAccount(provider),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PORTFOLIO_ACCOUNTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PORTFOLIO_PROJECTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PORTFOLIO_REPOSITORIES_QUERY_KEY }),
      ]);
    },
  });
}
