import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { IntegrationRadar, ReviewRow } from "../types/radar-integration.types";

const root = "/radar-integration";
const extract = <T,>(response: { data: ApiResponse<T> }): T => response.data.data;

/** Solicitudes correspondientes exclusivamente a Radar personal y revisión de evidencias. */
export const radarIntegrationApi = {
  me: async () => extract(await apiClient.get<ApiResponse<IntegrationRadar>>(`${root}/me`)),
  recalculate: async () => extract(await apiClient.post<ApiResponse<IntegrationRadar>>(`${root}/me/recalculate`)),
  rescanCurrentCv: async () => extract(await apiClient.post<ApiResponse<{cvId:string; submitted:boolean}>>(`${root}/me/cv-rescan`)),
  reviews: async () => extract(await apiClient.get<ApiResponse<ReviewRow[]>>(`${root}/admin/queue`)),
  decision: async (kind: string, id: string, decision: string) => extract(
    await apiClient.patch<ApiResponse<IntegrationRadar>>(`${root}/admin/reviews/${kind}/${id}`, { decision }),
  ),
  adminReprocessCv: async (id: string) => extract(
    await apiClient.post<ApiResponse<{cvId:string; extractionStatus:string; extractedCharacters:number; reviewStatus:string; nlpStatus:string}>>(`${root}/admin/cv/${id}/reprocess`),
  ),
  adminCv: async (id: string) => {
    const response = await apiClient.get<Blob>(`${root}/admin/cv/${id}/file`, { responseType: "blob" });
    return response.data;
  },
};

export type { IntegrationRadar, ReviewRow, Scores } from '../types/radar-integration.types';
