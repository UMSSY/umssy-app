import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { HeatmapFilters } from "../types/heatmap-filters.types";
import type { HeatmapData, HeatmapType } from "../types/heatmap.types";
import { semesterRangeToTimestamps } from "../utils/semester-range-to-timestamps";

export function toHeatmapQueryParams(filters: HeatmapFilters): Record<string, string> {
  const range = filters.semesterRange ? semesterRangeToTimestamps(filters.semesterRange) : undefined;
  const params: Record<string, string | undefined> = {
    careerId: filters.careerId,
    promotion: filters.promotion,
    year: range ? undefined : filters.year,
    month: filters.month,
    startTimestamp: range?.startTimestamp,
    endTimestamp: range?.endTimestamp,
  };
  return Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
}

export const heatmapsService = {
  getHeatmap: async (type: HeatmapType, filters: HeatmapFilters): Promise<ApiResponse<HeatmapData>> => {
    const { data } = await apiClient.get<ApiResponse<HeatmapData>>(`/analytics/heatmap/${type}`, {
      params: toHeatmapQueryParams(filters),
    });
    return data;
  },
};
