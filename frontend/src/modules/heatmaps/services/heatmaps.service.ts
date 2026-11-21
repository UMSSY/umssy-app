import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { getFileNameFromDisposition } from "@/shared/utils/download-file";
import { HEATMAP_PDF_FILE_NAME } from "../constants/heatmap-text.constants";
import type { HeatmapExportedFile } from "../types/heatmap-exported-file.types";
import type { HeatmapFilters } from "../types/heatmap-filters.types";
import type { HeatmapData } from "../types/heatmap-data.types";
import type { HeatmapType } from "../types/heatmap-type.types";
import { semesterRangeToTimestamps } from "../utils/semester-range-to-timestamps";

export function toHeatmapQueryParams(filters: HeatmapFilters): Record<string, string> {
  const range = filters.semesterRange ? semesterRangeToTimestamps(filters.semesterRange) : undefined;
  const params: Record<string, string | undefined> = {
    careerId: filters.careerId,
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
  exportHeatmapPdf: async (type: HeatmapType, filters: HeatmapFilters): Promise<HeatmapExportedFile> => {
    const response = await apiClient.get<Blob>(`/analytics/heatmap/${type}/export`, {
      params: { ...toHeatmapQueryParams(filters), format: "pdf" },
      responseType: "blob",
    });
    return {
      file: response.data,
      fileName: getFileNameFromDisposition(
        response.headers["content-disposition"] as string | undefined,
        HEATMAP_PDF_FILE_NAME(type),
      ),
    };
  },
};
