"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { PortfolioProviderName } from "../types/portfolio-provider-name.types";

export function usePortfolioProjects() {
  const query = useQuery<PortfolioProjectItem[]>({
    queryKey: PORTFOLIO_PROJECTS_QUERY_KEY,
    queryFn: () => portfolioProjectsService.getPortfolioProjects(),
    retry: false,
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdatePortfolioProjects() {
  const queryClient = useQueryClient();

  return useMutation<PortfolioProjectItem[], Error, UpdatePortfolioProjectsPayload>({
    mutationFn: (payload) => portfolioProjectsService.updatePortfolioProjects(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PORTFOLIO_PROJECTS_QUERY_KEY });
    },
  });
}

export function usePortfolioRepositories(
  enabled = true,
  provider?: PortfolioProviderName,
) {
  const query = useQuery<ExternalRepositoryItem[]>({
    queryKey: provider
      ? [...PORTFOLIO_REPOSITORIES_QUERY_KEY, provider]
      : PORTFOLIO_REPOSITORIES_QUERY_KEY,
    queryFn: () => portfolioProjectsService.getAvailableRepositories(provider),
    enabled,
    retry: false,
  });

  return {
    repositories: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSyncPortfolioProjects() {
  const queryClient = useQueryClient();

  return useMutation<PortfolioProjectItem[], Error, void>({
    mutationFn: () => portfolioProjectsService.syncPortfolioProjects(),
    onSuccess: async (syncedProjects) => {
      queryClient.setQueryData(PORTFOLIO_PROJECTS_QUERY_KEY, syncedProjects);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PORTFOLIO_PROJECTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PORTFOLIO_REPOSITORIES_QUERY_KEY }),
      ]);
    },
  });
}

