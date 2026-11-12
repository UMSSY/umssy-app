"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HEATMAPS_QUERY_KEYS } from "../constants/heatmap-text.constants";
import { heatmapsService, toHeatmapQueryParams } from "../services/heatmaps.service";
import type { HeatmapFilters } from "../types/heatmap-filters.types";
import type { HeatmapType } from "../types/heatmap.types";

export function useHeatmap(type: HeatmapType, filters: HeatmapFilters) {
  const query = useQuery({
    queryKey: HEATMAPS_QUERY_KEYS.detail(type, toHeatmapQueryParams(filters)),
    queryFn: () => heatmapsService.getHeatmap(type, filters),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data?.data,
    isLoading: query.isPending,
    hasError: query.isError,
    refetch: query.refetch,
  };
}
