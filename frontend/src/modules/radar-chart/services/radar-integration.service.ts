import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { IntegrationRadar, ReviewRow } from "../types/radar-integration.types";

const root = "/profile/me/radar";
const extract = <T,>(response: { data: ApiResponse<T> }): T => response.data.data;

/** Solicitudes correspondientes exclusivamente a Radar personal y revisión de evidencias. */
export const radarIntegrationApi = {
  me: async () => extract(await apiClient.get<ApiResponse<IntegrationRadar>>(`${root}`)),
  recalculate: async () => extract(await apiClient.post<ApiResponse<IntegrationRadar>>(`${root}/recalculations`)),
  rescanCurrentCv: async () => extract(await apiClient.post<ApiResponse<{cvId:string; submitted:boolean}>>(`${root}/cv-rescans`)),
  reviews: async () => extract(await apiClient.get<ApiResponse<ReviewRow[]>>("/radar-reviews")),
  decision: async (kind: string, id: string, decision: string) => extract(
    await apiClient.patch<ApiResponse<IntegrationRadar>>(`/radar-reviews/${kind}/${id}`, { decision }),
  ),
  adminReprocessCv: async (id: string) => extract(
    await apiClient.post<ApiResponse<{cvId:string; extractionStatus:string; extractedCharacters:number; reviewStatus:string; nlpStatus:string}>>(`/radar-reviews/cvs/${id}/reprocessings`),
  ),
  adminCv: async (id: string) => {
    const response = await apiClient.get<Blob>(`/radar-reviews/cvs/${id}/file`, { responseType: "blob" });
    return response.data;
  },
};

export type { IntegrationRadar, ReviewRow, Scores } from '../types/radar-integration.types';
