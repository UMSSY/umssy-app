import type { ApiResponse } from "@/shared/types/api-response.types";
import { HEATMAP_GRADUATES_MOCK } from "../data/heatmap-graduates.data";
import type { HeatmapFilters } from "../types/heatmap-filters.types";
import type { HeatmapData, HeatmapType } from "../types/heatmap.types";
import { buildHeatmapData } from "../utils/build-heatmap-data";
import { filterHeatmapRecords } from "../utils/filter-heatmap-records";
import { semesterRangeToTimestamps } from "../utils/semester-range-to-timestamps";

export function toHeatmapQueryParams(filters: HeatmapFilters): Record<string, string> {
  const range = filters.semesterRange ? semesterRangeToTimestamps(filters.semesterRange) : undefined;
  const params: Record<string, string | undefined> = {
    career: filters.career,
    year: range ? undefined : filters.year,
    month: filters.month,
    startTimestamp: range?.startTimestamp,
    endTimestamp: range?.endTimestamp,
  };
  return Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
}

export const heatmapsService = {
  // TODO: Reemplazar por apiClient.get(`/analytics/heatmap/${type}`, { params: toHeatmapQueryParams(filters) }) cuando exista el endpoint.
  getHeatmap: async (type: HeatmapType, filters: HeatmapFilters): Promise<ApiResponse<HeatmapData>> => ({
    statusCode: 200,
    ok: true,
    detail: "Operación exitosa",
    data: buildHeatmapData(type, filterHeatmapRecords(HEATMAP_GRADUATES_MOCK, filters)),
  }),
};
