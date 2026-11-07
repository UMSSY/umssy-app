import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type {
  AreaEvidence,
  RadarAxisId,
  RecruiterApplicantsResponse,
  RecruiterVacancy,
} from "../types/radar-recruiter.types";

const RADAR_ROOT = "/radar-integration";

function extract<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

export const radarRecruiterApi = {
  vacancies: async (): Promise<RecruiterVacancy[]> =>
    extract(
      await apiClient.get<ApiResponse<RecruiterVacancy[]>>(
        `${RADAR_ROOT}/recruiter/vacancies`,
      ),
    ),
  applicants: async (jobOfferId: string): Promise<RecruiterApplicantsResponse> =>
    extract(
      await apiClient.get<ApiResponse<RecruiterApplicantsResponse>>(
        `${RADAR_ROOT}/recruiter/vacancies/${jobOfferId}/applicants`,
      ),
    ),
  areaEvidence: async (
    applicationId: string,
    areaId: RadarAxisId,
  ): Promise<AreaEvidence> =>
    extract(
      await apiClient.get<ApiResponse<AreaEvidence>>(
        `${RADAR_ROOT}/recruiter/applications/${applicationId}/areas/${areaId}/evidence`,
      ),
    ),
  recruiterCv: async (applicationId: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `${RADAR_ROOT}/recruiter/applications/${applicationId}/cv`,
      { responseType: "blob" },
    );
    return response.data;
  },
  decide: async (
    applicationId: string,
    decision: "hired" | "rejected",
  ): Promise<{ id: string; state: string }> =>
    extract(
      await apiClient.patch<ApiResponse<{ id: string; state: string }>>(
        `${RADAR_ROOT}/recruiter/applications/${applicationId}`,
        { decision },
      ),
    ),
};
