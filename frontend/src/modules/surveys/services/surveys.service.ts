import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { getFileNameFromDisposition } from "@/shared/utils/download-file";
import type {
  Career,
  CreateSurveyPayload,
  CreatedSurvey,
  SurveyDetail,
  SurveyStatistics,
  SurveySummary,
} from "../types/survey.types";
import type { SubmitSurveyPayload } from "../types/survey-answer.types";

export const surveysService = {
  createSurvey: async (payload: CreateSurveyPayload): Promise<ApiResponse<CreatedSurvey>> => {
    const { data } = await apiClient.post<ApiResponse<CreatedSurvey>>("/surveys", payload);
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
    const { data } = await apiClient.get<ApiResponse<SurveyDetail>>(`/surveys/${id}`);
    return data;
  },

  updateSurvey: async (id: string, payload: CreateSurveyPayload): Promise<ApiResponse<CreatedSurvey>> => {
    const { data } = await apiClient.patch<ApiResponse<CreatedSurvey>>(`/surveys/${id}`, payload);
    return data;
  },

  getSurveyStatistics: async (id: string): Promise<ApiResponse<SurveyStatistics>> => {
    const { data } = await apiClient.get<ApiResponse<SurveyStatistics>>(`/surveys/${id}/statistics`);
    return data;
  },

  submitAnswers: async (
    id: string,
    payload: SubmitSurveyPayload,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/surveys/${id}/responses`,
      payload,
    );
    return data;
  },

  exportSurveyPdf: async (id: string): Promise<{ file: Blob; fileName: string }> => {
    const response = await apiClient.get<Blob>(`/surveys/${id}/export-pdf`, {
      responseType: "blob",
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


