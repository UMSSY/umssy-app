"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PORTFOLIO_ACCOUNTS_QUERY_KEY,
} from "../constants/portfolio-accounts.constants";
import { portfolioAccountsService } from "../services/portfolio-accounts.service";
import { assignWindowLocation } from "../utils/assign-window-location";
import type {
  PortfolioAccountStatusResponse,
  PortfolioConnectedAccountResponse,
  PortfolioOAuthCallbackPayload,
  PortfolioOAuthUrlResponse,
  PortfolioProviderName,
} from "../types/portfolio-account.types";

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
