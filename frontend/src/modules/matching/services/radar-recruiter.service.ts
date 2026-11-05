import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type {
  AreaEvidence,
  RadarAxisId,
  RecruiterApplicantsResponse,
  RecruiterVacancy,
} from "../types/radar-recruiter.types";

const root = "/radar-integration";

function extract<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

export const radarRecruiterApi = {
  vacancies: async () =>
    extract(
      await apiClient.get<ApiResponse<RecruiterVacancy[]>>(`${root}/recruiter/vacancies`)
    ),
  applicants: async (jobOfferId: string) =>
    extract(
      await apiClient.get<ApiResponse<RecruiterApplicantsResponse>>(
        `${root}/recruiter/vacancies/${jobOfferId}/applicants`
      )
    ),
  areaEvidence: async (applicationId: string, areaId: RadarAxisId) =>
    extract(
      await apiClient.get<ApiResponse<AreaEvidence>>(
        `${root}/recruiter/applications/${applicationId}/areas/${areaId}/evidence`
      )
    ),
  recruiterCv: async (applicationId: string) => {
    const response = await apiClient.get<Blob>(
      `${root}/recruiter/applications/${applicationId}/cv`,
      { responseType: "blob" }
    );
    return response.data;
  },
  decide: async (applicationId: string, decision: "hired" | "rejected") =>
    extract(
      await apiClient.patch<ApiResponse<{ id: string; state: string }>>(
        `${root}/recruiter/applications/${applicationId}`,
        { decision }
      )
    ),
};
