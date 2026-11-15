"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PORTFOLIO_PROJECTS_QUERY_KEY } from "../constants/portfolio-projects.constants";
import { portfolioProjectsService } from "../services/portfolio-projects.service";
import type {
  PortfolioProjectItem,
  UpdatePortfolioProjectsPayload,
} from "../types/portfolio-project.types";

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

