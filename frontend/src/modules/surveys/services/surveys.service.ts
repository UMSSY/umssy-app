import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { getFileNameFromDisposition } from "@/shared/utils/download-file";
import type { Career } from "../types/career.types";
import type { CreateSurveyPayload } from "../types/create-survey-payload.types";
import type { CreatedSurvey } from "../types/created-survey.types";
import type { SurveyDetail } from "../types/survey-detail.types";
import type { SurveyStatistics } from "../types/survey-statistics.types";
import type { SurveySummary } from "../types/survey-summary.types";
import type { SubmitSurveyPayload } from "../types/submit-survey-payload.types";

export const surveysService = {
  createSurvey: async (
    payload: CreateSurveyPayload,
  ): Promise<ApiResponse<CreatedSurvey>> => {
    const { data } = await apiClient.post<ApiResponse<CreatedSurvey>>("/surveys", payload, {
      timeout: 15_000,
    });
    return data;
  },

  listSurveys: async (): Promise<ApiResponse<SurveySummary[]>> => {
    const { data } = await apiClient.get<ApiResponse<SurveySummary[]>>("/surveys");
    return data;
  },

  listCareers: async (): Promise<ApiResponse<Career[]>> => {
    const { data } = await apiClient.get<ApiResponse<Career[]>>("/careers");
    return data;
  },

  getSurvey: async (id: string): Promise<ApiResponse<SurveyDetail>> => {
    const { data } = await apiClient.get<ApiResponse<SurveyDetail>>(
      `/surveys/${id}`,
    );
    return data;
  },

  updateSurvey: async (
    id: string,
    payload: CreateSurveyPayload,
  ): Promise<ApiResponse<CreatedSurvey>> => {
    const { data } = await apiClient.patch<ApiResponse<CreatedSurvey>>(
      `/surveys/${id}`,
      payload,
      {
        timeout: 15_000,
      },
    );
    return data;
  },

  unpublishSurvey: async (id: string): Promise<void> => {
    await apiClient.patch(`/surveys/${id}/unpublish`, undefined, {
      timeout: 15_000,
    });
  },

  getSurveyStatistics: async (
    id: string,
    period?: string,
  ): Promise<ApiResponse<SurveyStatistics>> => {
    const { data } = await apiClient.get<ApiResponse<SurveyStatistics>>(
      `/surveys/${id}/statistics`,
      {
        params: { period },
      },
    );
    return data;
  },

  submitAnswers: async (
    id: string,
    payload: SubmitSurveyPayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const { data } = await apiClient.post<
      ApiResponse<{ success: boolean; message: string }>
    >(`/surveys/${id}/responses`, payload);
    return data;
  },

  exportSurveyPdf: async (
    id: string,
    period?: string,
  ): Promise<{ file: Blob; fileName: string }> => {
    const response = await apiClient.get<Blob>(`/surveys/${id}/report`, {
      responseType: "blob",
      params: { period },
    });
    return {
      file: response.data,
      fileName: getFileNameFromDisposition(
        response.headers["content-disposition"] as string | undefined,
        `reporte-encuesta-${id}.pdf`,
      ),
    };
  },
};
